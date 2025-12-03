import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSlide, deleteSlide, fetchSlides, updateSlide } from '../services/api';
import { generateId } from '../services/id';

const SLIDES_KEY = ['slides'];

export function useSlides() {
  const queryClient = useQueryClient();
  const slidesQuery = useQuery({ queryKey: SLIDES_KEY, queryFn: fetchSlides });

  const createSlideMutation = useMutation({
    mutationFn: (payload) => createSlide(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: SLIDES_KEY });
      const previousSlides = queryClient.getQueryData(SLIDES_KEY) || [];
      const tempId = payload.id || generateId();
      const optimistic = { ...payload, id: tempId };
      queryClient.setQueryData(SLIDES_KEY, [...previousSlides, optimistic]);
      return { previousSlides, tempId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(SLIDES_KEY, context.previousSlides);
      }
    },
    onSuccess: (data, _vars, context) => {
      queryClient.setQueryData(SLIDES_KEY, (slides) =>
        (slides || []).map((slide) => (slide.id === context?.tempId ? data : slide))
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SLIDES_KEY }),
  });

  const updateSlideMutation = useMutation({
    mutationFn: ({ id, updates }) => updateSlide(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: SLIDES_KEY });
      const previousSlides = queryClient.getQueryData(SLIDES_KEY) || [];
      queryClient.setQueryData(SLIDES_KEY, (slides = []) =>
        slides.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide))
      );
      return { previousSlides };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(SLIDES_KEY, context.previousSlides);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SLIDES_KEY }),
  });

  const deleteSlideMutation = useMutation({
    mutationFn: (id) => deleteSlide(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SLIDES_KEY });
      const previousSlides = queryClient.getQueryData(SLIDES_KEY) || [];
      queryClient.setQueryData(SLIDES_KEY, (slides = []) => slides.filter((slide) => slide.id !== id));
      return { previousSlides };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(SLIDES_KEY, context.previousSlides);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: SLIDES_KEY }),
  });

  return {
    ...slidesQuery,
    createSlide: createSlideMutation.mutateAsync,
    updateSlide: updateSlideMutation.mutateAsync,
    deleteSlide: deleteSlideMutation.mutateAsync,
    isSaving:
      createSlideMutation.isPending || updateSlideMutation.isPending || deleteSlideMutation.isPending,
  };
}
