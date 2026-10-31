import { CallButtons } from '../components/CallButtons';
import Link from 'next/link';

/** Even a wrong address leads to the emergency numbers. */
export default function NotFound() {
  return (
    <>
      <h1>404</h1>
      <p>
        <Link href="/">Home</Link>
      </p>
      <CallButtons withHospital={false} />
    </>
  );
}
