import { Spinner } from 'react-bootstrap';

export default function Loading() {
  return (
    <div className="loading-container">
      <Spinner animation="border" variant="primary" />
    </div>
  );
}
