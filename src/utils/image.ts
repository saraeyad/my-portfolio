export async function loadImageFromSrcSet({
  src,
  srcSet,
  sizes,
}: {
  src?: string
  srcSet?: string
  sizes?: string
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!src && !srcSet) throw new Error('No image src or srcSet provided')

      let tempImage: HTMLImageElement | null = new Image()

      if (src) tempImage.src = src
      if (srcSet) tempImage.srcset = srcSet
      if (sizes) tempImage.sizes = sizes

      const onLoad = () => {
        tempImage!.removeEventListener('load', onLoad)
        const source = tempImage!.currentSrc
        tempImage = null
        resolve(source)
      }

      tempImage.addEventListener('load', onLoad)
    } catch (error) {
      reject(`Error loading ${srcSet}: ${error}`)
    }
  })
}

async function generateImage(width = 1, height = 1): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = height
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, width, height)

    canvas.toBlob(async blob => {
      if (!blob) throw new Error('Video thumbnail failed to load')
      const image = URL.createObjectURL(blob)
      canvas.remove()
      resolve(image)
    })
  })
}

export async function resolveSrcFromSrcSet({
  srcSet,
  sizes,
}: {
  srcSet: string
  sizes?: string
}): Promise<string> {
  const sources = await Promise.all(
    srcSet.split(', ').map(async srcString => {
      const [src, width] = srcString.split(' ')
      const size = Number(width.replace('w', ''))
      const image = await generateImage(size)
      return { src, image, width }
    })
  )

  const fakeSrcSet = sources.map(({ image, width }) => `${image} ${width}`).join(', ')
  const fakeSrc = await loadImageFromSrcSet({ srcSet: fakeSrcSet, sizes })

  const output = sources.find(s => s.image === fakeSrc)
  return output!.src
}
