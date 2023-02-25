export const rawToView = (raw: any) => {
  const view = {}
  Object.keys(raw).forEach(key => {
    view[key.replace(/^\w*_/, '')] = raw[key]
  })

  return view
}