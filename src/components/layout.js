/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

import Header from './header'
import SideMenu from './SideMenu'
import Footer from './Footer'

import theme from '../styles/theme'
import vars from '../styles/vars'
import media from '../styles/media'

import '../styles/global.css'

const Main = styled.main`
	padding-top: ${vars.sideWidth.desktop};
	background-color: white;
`

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
`

const Container = styled.div`
	width: 100%;
	height: 100%;
	max-width: 1440px;
	margin: 0 auto;
	padding: 0 ${vars.sideWidth.mobile};
	${media.greaterThan('tablet')`
		padding: 0 ${vars.sideWidth.tablet};
	`};
	${media.greaterThan('desktop')`
		padding: 0 ${vars.sideWidth.desktop};
	`};
`

const Layout = ({ page, children }) => {
	const data = useStaticQuery(graphql`
		query SiteTitleQuery {
			site {
				siteMetadata {
					title
				}
			}
		}
	`)

	return (
		<ThemeProvider theme={theme.light}>
			<Main>
				<Wrapper>
					<Header siteTitle={data.site.siteMetadata.title} />
					<SideMenu
						links={[ { name: 'Contact', url: '/contact' }, { name: 'About', url: '/about' } ]}
						position={`left`}
					/>
					<Container>{children}</Container>
					<SideMenu
						links={[ { name: 'Articles', url: '/articles' }, { name: 'Projects', url: '/projects' } ]}
						position={`right`}
					/>
					{page === 'Home' ? <Footer /> : null}
				</Wrapper>
			</Main>
		</ThemeProvider>
	)
}

Layout.propTypes = {
	children: PropTypes.node.isRequired
}

export default Layout
