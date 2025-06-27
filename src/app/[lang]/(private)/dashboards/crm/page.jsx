import Welcome from '@/views'

export const metadata = {
  title: `${process.env.TITLE} - Home`,
}

export default async function Home() {

  return (
    <Welcome></Welcome>
  )

}