import React, { FC } from 'react'
import { Layout, Menu } from 'antd'
import './index.scss'
import { Link, Outlet } from 'react-router-dom'

const { Header, Content } = Layout

const pages = ['/', '/settings']

const Main: FC = () => {
  return (
  <Layout className={'layout-main'}>
    <Header>
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['2']}
        items={pages.map((name, index) => {
          const key = index + 1

          return {
            key,
            label: <Link to={name}>nav {key}</Link>
          }
        })}
      />
    </Header>
    <Content>
      <Outlet/>
    </Content>
  </Layout>
  )
}

export default Main
