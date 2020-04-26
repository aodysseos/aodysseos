import { generateMedia } from 'styled-media-query'
import _reduce from 'lodash/reduce'
import vars from './vars'

const breakpointWithUnits = _reduce(
	vars.breakpoints,
	(memo, breakpoint, key) => {
		memo[key] = breakpoint
		return memo
	},
	{}
)

const media = generateMedia(breakpointWithUnits)

export default media
