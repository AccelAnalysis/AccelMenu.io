export const seedData = {
  locations: [
    {
      id: 'loc1',
      name: 'Downtown Burger Bar',
      screens: [
        {
          id: 'screen1',
          name: 'Main Menu Board',
          rotation: 8000,
          slides: ['slide1', 'slide2']
        },
        {
          id: 'screen2',
          name: 'Promo Vertical',
          rotation: 5000,
          slides: ['slide3']
        }
      ]
    }
  ],
  slides: [
    {
      id: 'slide1',
      name: 'Burger Specials',
      background: '#1a1a1a'
    },
    {
      id: 'slide2',
      name: 'Drinks Menu',
      background: '#2d1b1b'
    },
    {
      id: 'slide3',
      name: 'Weekend Promo',
      background: '#0f172a'
    }
  ]
};
