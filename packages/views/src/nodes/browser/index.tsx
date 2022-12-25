import React, { FC, useEffect, useRef, useState } from 'react'
import './index.scss'
import { Spin } from 'antd'
import { onEvent } from '../../utils'
import 'antd/dist/reset.css'
import WindowToolBar from '../../components/WindowToolBar'
import SearchBar from './elements/SearchBar'
import useElectron from '../../hooks/electron'

const computeRect = ({
  left,
  top,
  width,
  height
}: {
  left: number
  top: number
  width: number
  height: number
}) => ({
  x: Math.floor(left),
  y: Math.floor(top),
  width: Math.floor(width),
  height: Math.floor(height)
})

const BrowserWindow: FC = () => {
  const [url, setUrl] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [isFav, setIsFav] = useState<boolean>(false)
  const webviewRef = useRef<HTMLDivElement>()
  const resizeObserver = useRef<ResizeObserver>()
  const {
    browserViewGoBack,
    browserViewReload,
    browserViewLoadURL,
    addEventListener,
    setBrowserViewRect,
    removeEventListener,
    closeBrowserWindow,
    minimize
  } = useElectron()

  useEffect(() => {
    initWebView()
    addEventListener('dom-ready', handleViewDOMReady)

    return () => {
      setBrowserViewRect({ x: 0, y: 0, height: 0, width: 0 })
      removeEventListener('dom-ready', handleViewDOMReady)
      resizeObserver.current?.disconnect()
    }
  }, [])

  const handleViewDOMReady = async (
    e: Electron.IpcRendererEvent,
    { url, title }: { url: string, title: string }
  ): Promise<void> => {
    // todo: 添加收藏
    // const isFav = await isFavFunc(url);
    const isFav = false
    setUrl(url)
    setTitle(title)
    setIsFav(isFav)
    document.title = title
  }

  const initWebView = () => {
    if (webviewRef.current != null) {
      const rect = computeRect(webviewRef.current.getBoundingClientRect())
      setBrowserViewRect(rect)

      // 监控 webview 元素的大小
      resizeObserver.current = new ResizeObserver((entries) => {
        const entry = entries[0]
        const viewRect = computeRect(entry.contentRect)
        viewRect.x += rect.x
        viewRect.y += rect.y
        setBrowserViewRect(viewRect)
      })

      resizeObserver.current.observe(webviewRef.current)
    }
  }

  const onGoBack = () => {
    onEvent.browserPageGoBack()
    browserViewGoBack()
  }

  const onReload = () => {
    onEvent.browserPageReload()
    browserViewReload()
  }

  const onGoBackHome = () => {
    browserViewLoadURL()
  }

  const onUrlChange = (url: string) => {
    setUrl(url)
  }

  const handleEnter = () => {
    browserViewLoadURL(url)
  }

  const handleClickFav = async () => {
    // todo: 添加收藏取消收藏
    // const isFav = await isFavFunc(url);
    // if (isFav) {
    //   await removeFav({ title, url });
    // } else {
    //   await insertFav({ title, url });
    // }
    setIsFav((fav) => !fav)
  }

  return (
    <div className="browser-window">
      <WindowToolBar
        onClose={() => {
          closeBrowserWindow()
        }}
        onMinimize={() => {
          minimize('')
        }}
      >
        {title}
      </WindowToolBar>
      <div className="webview-container">
        <SearchBar
          className="webview-nav"
          url={url}
          isFav={isFav}
          onUrlChange={onUrlChange}
          onGoBack={onGoBack}
          onReload={onReload}
          onGoBackHome={onGoBackHome}
          handleEnter={handleEnter}
          handleClickFav={handleClickFav}
        />
        <div className="webview-inner">
          <div id="videoView" ref={webviewRef as any}>
            <Spin />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrowserWindow
