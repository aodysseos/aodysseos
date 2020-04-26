import React from 'react'
import styled from 'styled-components'
import _map from 'lodash/map'

import Card from './card'

const Wrapper = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: stretch;
	margin-top: 64px;
`

const ArticlesContainer = ({ articles }) => {
	return <Wrapper>{_map(articles, (article, index) => <Card key={index} {...article} />)}</Wrapper>
}

export default ArticlesContainer
