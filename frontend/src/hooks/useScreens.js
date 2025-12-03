import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createScreen, deleteScreen, fetchScreens, updateScreen } from '../services/api';
import { generateId } from '../services/id';

const SCREENS_KEY = ['screens'];

export function useScreens() {
  const queryClient = useQueryClient();
  const screensQuery = useQuery({ queryKey: SCREENS_KEY, queryFn: fetchScreens });

  const createScreenMutation = useMutation({
    mutationFn: (payload) => createScreen(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: SCREENS_KEY });
      const previousScreens = queryClient.getQueryData(SCREENS_KEY) || [];
      const tempId = payload.id || generateId();
      const optimistic = { ...payload, id: tempId, slides: payload.slides || [] };
      queryClient.setQueryData(SCREENS_KEY, [...previousScreens, optimistic]);
      return { previousScreens, tempId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousScreens) {
        queryClient.setQueryData(SCREENS_KEY, context.previousScreens);
      }
    },
    onSuccess: (data, _vars, context) => {
      queryClient.setQueryData(SCREENS_KEY, (screens) =>
        (screens || []).map((screen) => (screen.id === context?.tempId ? data : screen))
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SCREENS_KEY }),
  });

  const updateScreenMutation = useMutation({
    mutationFn: ({ id, updates }) => updateScreen(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: SCREENS_KEY });
      const previousScreens = queryClient.getQueryData(SCREENS_KEY) || [];
      queryClient.setQueryData(SCREENS_KEY, (screens = []) =>
        screens.map((screen) => (screen.id === id ? { ...screen, ...updates } : screen))
      );
      return { previousScreens };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousScreens) {
        queryClient.setQueryData(SCREENS_KEY, context.previousScreens);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SCREENS_KEY }),
  });

  const deleteScreenMutation = useMutation({
    mutationFn: (id) => deleteScreen(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SCREENS_KEY });
      const previousScreens = queryClient.getQueryData(SCREENS_KEY) || [];
      queryClient.setQueryData(SCREENS_KEY, (screens = []) => screens.filter((screen) => screen.id !== id));
      return { previousScreens };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousScreens) {
        queryClient.setQueryData(SCREENS_KEY, context.previousScreens);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SCREENS_KEY }),
  });

  return {
    ...screensQuery,
    createScreen: createScreenMutation.mutateAsync,
    updateScreen: updateScreenMutation.mutateAsync,
    deleteScreen: deleteScreenMutation.mutateAsync,
  };
}
