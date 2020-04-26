import useWindowSize from './useWindowSize'
import vars from '../styles/vars'

const useMedia = () => {
	const windowSize = useWindowSize()

	const getMedia = (width) => {
		switch (width) {
			case width < vars.breakpointsPx.mobile:
				return 'mobile'
				break
			case width < vars.breakpointsPx.tablet:
				return 'tablet'
				break
			case width < vars.breakpointsPx.desktop:
				return 'desktop'
				break
			default:
				return 'desktop'
				break
		}
	}

	return getMedia(windowSize.width)
}

export default useMedia
