const helpUrl =
  'https://blog.ziying.site/post/media-downloader-how-to-use/?form=client'

interface Option {
  value: string
  label: string
}

const downloaderOptions: Option[] = []

if (window.electron.isWindows) {
  downloaderOptions.push({
    value: 'N_m3u8DL-CLI',
    label: 'N_m3u8DL-CLI（推荐）'
  })
}
downloaderOptions.push({
  value: 'mediago',
  label: 'mediago'
})

export { downloaderOptions, helpUrl }
