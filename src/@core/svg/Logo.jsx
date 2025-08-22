const Logo = (props) => {
  return (
    <img
      src={process.env.NEXT_PUBLIC_LOGO}
      width={40}
      {...props}
    />
  )
}

export default Logo