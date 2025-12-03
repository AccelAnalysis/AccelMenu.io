import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToPlaylist, fetchPlaylist, removeFromPlaylist, reorderPlaylist } from '../services/api';

const playlistKey = (screenId) => ['playlist', screenId];

export function usePlaylist(screenId) {
  const queryClient = useQueryClient();

  const playlistQuery = useQuery({
    queryKey: playlistKey(screenId),
    queryFn: () => fetchPlaylist(screenId),
    enabled: Boolean(screenId),
    initialData: [],
  });

  const addSlideMutation = useMutation({
    mutationFn: ({ screenId: targetScreenId, slideId }) => addToPlaylist(targetScreenId, { slideId }),
    onMutate: async ({ screenId: targetScreenId, slideId }) => {
      await queryClient.cancelQueries({ queryKey: playlistKey(targetScreenId) });
      const previousPlaylist = queryClient.getQueryData(playlistKey(targetScreenId)) || [];
      const optimistic = [...previousPlaylist, slideId];
      queryClient.setQueryData(playlistKey(targetScreenId), optimistic);
      queryClient.setQueryData(['screens'], (screens = []) =>
        screens.map((screen) =>
          screen.id === targetScreenId ? { ...screen, slides: optimistic } : screen
        )
      );
      return { previousPlaylist, screenId: targetScreenId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(playlistKey(context.screenId), context.previousPlaylist);
        queryClient.setQueryData(['screens'], (screens = []) =>
          screens.map((screen) =>
            screen.id === context.screenId ? { ...screen, slides: context.previousPlaylist } : screen
          )
        );
      }
    },
    onSettled: (_data, _error, { screenId: targetScreenId }) => {
      queryClient.invalidateQueries({ queryKey: playlistKey(targetScreenId) });
      queryClient.invalidateQueries({ queryKey: ['screens'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ screenId: targetScreenId, order }) => reorderPlaylist(targetScreenId, { order }),
    onMutate: async ({ screenId: targetScreenId, order }) => {
      await queryClient.cancelQueries({ queryKey: playlistKey(targetScreenId) });
      const previousPlaylist = queryClient.getQueryData(playlistKey(targetScreenId)) || [];
      queryClient.setQueryData(playlistKey(targetScreenId), order);
      queryClient.setQueryData(['screens'], (screens = []) =>
        screens.map((screen) => (screen.id === targetScreenId ? { ...screen, slides: order } : screen))
      );
      return { previousPlaylist, screenId: targetScreenId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(playlistKey(context.screenId), context.previousPlaylist);
        queryClient.setQueryData(['screens'], (screens = []) =>
          screens.map((screen) =>
            screen.id === context.screenId ? { ...screen, slides: context.previousPlaylist } : screen
          )
        );
      }
    },
    onSettled: (_data, _error, { screenId: targetScreenId }) => {
      queryClient.invalidateQueries({ queryKey: playlistKey(targetScreenId) });
      queryClient.invalidateQueries({ queryKey: ['screens'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ screenId: targetScreenId, itemId }) => removeFromPlaylist(targetScreenId, itemId),
    onMutate: async ({ screenId: targetScreenId, itemId }) => {
      await queryClient.cancelQueries({ queryKey: playlistKey(targetScreenId) });
      const previousPlaylist = queryClient.getQueryData(playlistKey(targetScreenId)) || [];
      const updated = previousPlaylist.filter((id, idx) => idx !== itemId && id !== itemId);
      queryClient.setQueryData(playlistKey(targetScreenId), updated);
      queryClient.setQueryData(['screens'], (screens = []) =>
        screens.map((screen) => (screen.id === targetScreenId ? { ...screen, slides: updated } : screen))
      );
      return { previousPlaylist, screenId: targetScreenId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(playlistKey(context.screenId), context.previousPlaylist);
        queryClient.setQueryData(['screens'], (screens = []) =>
          screens.map((screen) =>
            screen.id === context.screenId ? { ...screen, slides: context.previousPlaylist } : screen
          )
        );
      }
    },
    onSettled: (_data, _error, { screenId: targetScreenId }) => {
      queryClient.invalidateQueries({ queryKey: playlistKey(targetScreenId) });
      queryClient.invalidateQueries({ queryKey: ['screens'] });
    },
  });

  return {
    ...playlistQuery,
    addSlide: addSlideMutation.mutateAsync,
    reorderPlaylist: reorderMutation.mutateAsync,
    removeFromPlaylist: removeMutation.mutateAsync,
  };
}
