import {
  InstancePresenceRecordType,
  TLAnyShapeUtilConstructor,
  TLInstancePresence,
  TLRecord,
  TLStore,
  TLStoreWithStatus,
  computed,
  createPresenceStateDerivation,
  createTLStore,
  defaultShapeUtils,
  defaultUserPreferences,
  getUserPreferences,
  react,
  setUserPreferences,
  transact,
} from '@tldraw/tldraw';
import { useEffect, useMemo, useState } from 'react';
import { YKeyValue } from 'y-utility/y-keyvalue';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

export function useYjsStore({
  roomId = 'example',
  hostUrl = 'ws://localhost:1234',
  defaultWhiteboard = null,
  shapeUtils = [],
  onUpdate,
}: Partial<{
  hostUrl: string;
  roomId: string;
  version: number;
  defaultWhiteboard?: string | null;
  onUpdate: (store: TLStore) => void;
  shapeUtils: TLAnyShapeUtilConstructor[];
}>) {
  // Initialize the store state using the createTLStore function
  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    // store.loadSnapshot(DEFAULT_STORE);
    return store;
  });

  // Initialize the storeWithStatus state with 'loading' status
  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: 'loading',
  });

  // Initialize yDoc, yStore, and room using useMemo
  const { yDoc, yStore, room } = useMemo(() => {
    // Create a new Y.Doc instance with garbage collection enabled
    const yDoc = new Y.Doc({ gc: true });

    // Get the Y.Array instance for the specified roomId
    const yArr = yDoc.getArray<{ key: string; val: TLRecord }>(`tl_${roomId}`);

    // Create a new YKeyValue instance using the Y.Array
    const yStore = new YKeyValue(yArr);

    // Create a new WebsocketProvider instance with the specified hostUrl, roomId, yDoc, and connect options
    const room = new WebsocketProvider(hostUrl, roomId, yDoc, {
      connect: true,
    });

    return {
      yDoc,
      yStore,
      room,
    };
  }, [hostUrl, roomId]);

  useEffect(() => {
    setStoreWithStatus({ status: 'loading' });

    const unsubs: (() => void)[] = [];

    function handleSync() {
      // Connect store to yjs store and vis versa, for both the document and awareness

      /* -------------------- Document -------------------- */

      // Sync store changes to the yjs doc
      unsubs.push(
        store.listen(
          function syncStoreChangesToYjsDoc({ changes }) {
            yDoc.transact(() => {
              Object.values(changes.added).forEach((record) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.updated).forEach(([_, record]) => {
                yStore.set(record.id, record);
              });

              Object.values(changes.removed).forEach((record) => {
                yStore.delete(record.id);
              });
            });
          },
          { source: 'user', scope: 'document' }, // only sync user's document changes
        ),
      );

      // Sync the yjs doc changes to the store
      const handleChange = (
        changes: Map<
          string,
          | { action: 'delete'; oldValue: TLRecord }
          | { action: 'update'; oldValue: TLRecord; newValue: TLRecord }
          | { action: 'add'; newValue: TLRecord }
        >,
        transaction: Y.Transaction,
      ) => {
        if (transaction.local) {
          if (onUpdate) {
            onUpdate(store);
          }
        }

        const toRemove: TLRecord['id'][] = [];
        const toPut: TLRecord[] = [];

        changes.forEach((change, id) => {
          switch (change.action) {
            case 'add':
            case 'update': {
              const record = yStore.get(id)!;
              toPut.push(record);
              break;
            }
            case 'delete': {
              toRemove.push(id as TLRecord['id']);
              break;
            }
          }
        });

        // put / remove the records in the store
        // like shape and other
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      yStore.on('change', handleChange);
      unsubs.push(() => yStore.off('change', handleChange));

      /* -------------------- Awareness ------------------- */

      const yClientId = room.awareness.clientID.toString();
      setUserPreferences({ id: yClientId });

      const userPreferences = computed<{
        id: string;
        color: string;
        name: string;
      }>('userPreferences', () => {
        const user = getUserPreferences();
        return {
          id: user.id,
          color: user.color ?? defaultUserPreferences.color,
          name: user.name ?? defaultUserPreferences.name,
        };
      });

      // Create the instance presence derivation
      const presenceId = InstancePresenceRecordType.createId(yClientId);
      const presenceDerivation = createPresenceStateDerivation(
        userPreferences,
        presenceId,
      )(store);

      // Set our initial presence from the derivation's current value
      room.awareness.setLocalStateField('presence', presenceDerivation.value);

      // When the derivation change, sync presence to to yjs awareness
      unsubs.push(
        react('when presence changes', () => {
          const presence = presenceDerivation.value;
          requestAnimationFrame(() => {
            room.awareness.setLocalStateField('presence', presence);
          });
        }),
      );

      // Sync yjs awareness changes to the store
      const handleUpdate = (update: {
        added: number[];
        updated: number[];
        removed: number[];
      }) => {
        const states = room.awareness.getStates() as Map<
          number,
          { presence: TLInstancePresence }
        >;

        const toRemove: TLInstancePresence['id'][] = [];
        const toPut: TLInstancePresence[] = [];

        // Connect records to put / remove
        for (const clientId of update.added) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.updated) {
          const state = states.get(clientId);
          if (state?.presence && state.presence.id !== presenceId) {
            toPut.push(state.presence);
          }
        }

        for (const clientId of update.removed) {
          toRemove.push(
            InstancePresenceRecordType.createId(clientId.toString()),
          );
        }

        // put / remove the records in the store
        store.mergeRemoteChanges(() => {
          if (toRemove.length) store.remove(toRemove);
          if (toPut.length) store.put(toPut);
        });
      };

      // on user cursor move / active
      room.awareness.on('update', handleUpdate);
      unsubs.push(() => room.awareness.off('update', handleUpdate));

      // 2.
      // Initialize the store with the yjs doc records—or, if the yjs doc
      // is empty, initialize the yjs doc with the default store records.
      if (yStore.yarray.length) {
        // Replace the store records with the yjs doc records

        transact(() => {
          // The records here should be compatible with what's in the store
          store.clear();
          const records = yStore.yarray.toJSON().map(({ val }) => val);
          store.put(records);
        });
      }
      // fallback to database mongo if no data -> in case something happen
      else if (defaultWhiteboard) {
        transact(() => {
          store.clear();
          store.loadSnapshot(JSON.parse(defaultWhiteboard));
        });
      } else {
        // Create the initial store records
        // Sync the store records to the yjs doc
        yDoc.transact(() => {
          for (const record of store.allRecords()) {
            yStore.set(record.id, record);
          }
        });
      }

      setStoreWithStatus({
        store,
        status: 'synced-remote',
        connectionStatus: 'online',
      });
    }

    let hasConnectedBefore = false;

    function handleStatusChange({
      status,
    }: {
      status: 'disconnected' | 'connected';
    }) {
      // If we're disconnected, set the store status to 'synced-remote' and the connection status to 'offline'
      if (status === 'disconnected') {
        setStoreWithStatus({
          store,
          status: 'synced-remote',
          connectionStatus: 'offline',
        });
        return;
      }

      room.off('synced', handleSync);

      if (status === 'connected') {
        if (hasConnectedBefore) return;
        hasConnectedBefore = true;
        room.on('synced', handleSync);
        unsubs.push(() => room.off('synced', handleSync));
      }
    }

    room.on('status', handleStatusChange);
    unsubs.push(() => room.off('status', handleStatusChange));

    return () => {
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
  }, [room, yDoc, store, yStore]);

  return storeWithStatus;
}
