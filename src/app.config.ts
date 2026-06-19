export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/collaborate/index',
    'pages/summary/index',
    'pages/detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1D2129',
    navigationBarTitleText: '舆情值班本',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#B4282D',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '值班本'
      },
      {
        pagePath: 'pages/collaborate/index',
        text: '协同派单'
      },
      {
        pagePath: 'pages/summary/index',
        text: '同步汇总'
      }
    ]
  }
})
