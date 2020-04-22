import React from 'react'
import styled from 'styled-components'
import _map from 'lodash/map'
import _size from 'lodash/size'
import { getAssetSrc } from '../../utils/contentful/helpers'

const Wrapper = styled.div`
  /* background-image: url("${(props) => props.src}");
	background-position: center top; */
	background-color: ${(props) => props.backgroundColor};
  margin: 0px 0px 0px auto;
  min-height: 100px;
  width: 83%;
  height: 393.024px;
  overflow: hidden;
`

const IconsWrapper = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
`

const Icon = styled.img`
	width: auto;
	height: 100px;
`

const Hero = ({ imageUrl, bannerIcons, backgroundColor }) => (
	<Wrapper src={imageUrl} backgroundColor={backgroundColor}>
		{_size(bannerIcons) > 0 && (
			<IconsWrapper>
				{_map(bannerIcons, (icon) => {
					return <Icon src={getAssetSrc(icon)} />
				})}
			</IconsWrapper>
		)}
	</Wrapper>
)

export default Hero
