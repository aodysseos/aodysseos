import React from 'react'
import AniLink from 'gatsby-plugin-transition-link/AniLink'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import vars from '../styles/vars'

const Head = styled.div`
	width: 100%;
	height: ${vars.sideWidth.sm}px;
	position: fixed;
	left: 0px;
	top: 0px;
	transition: top 0.5s ease;
	display: flex;
	justify-content: center;
	padding: 20px 0;
	background-color: ${({ theme }) => theme.background};
`

const Logo = styled(AniLink)`
	font-family: "Montserrat";
	font-size: 13px;
	font-weight: 800;
	text-align: center;
	text-transform: uppercase;
	color: ${({ theme }) => theme.primary};

	> span {
		display: inline-block;
		line-height: 1;
		transform: scale(1, -1);
	}

	&:hover {
		/* color: white;
		text-shadow: rgba(0, 0, 0, 1) 0px 0px 1px; */
		/* opacity: .5; */
		color: rgba(0, 0, 0, .5);
	}
`

const Header = ({ siteTitle }) => (
	<Head>
		<Logo to={`/`}>
			<span>Andreas</span>odysseos
		</Logo>
	</Head>
)

Header.propTypes = {
	siteTitle: PropTypes.string
}

Header.defaultProps = {
	siteTitle: ``
}

export default Header
