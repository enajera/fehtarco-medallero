import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { athletesApi } from '../api/client';
import { formatError } from '../utils/errors';

interface PhotoUploadProps {
  athleteId: number;
  currentPhotoUrl?: string;
  onPhotoUpdated: (newPhotoUrl: string) => void;
}

export default function PhotoUpload({ athleteId, currentPhotoUrl, onPhotoUpdated }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(currentPhotoUrl || '');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate size (max 3MB)
    if (selectedFile.size > 3 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 3MB.');
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Tipo de archivo inválido. Solo se permiten JPEG, PNG y WebP.');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const response = await athletesApi.uploadPhoto(athleteId, file);
      const newPhotoUrl = response.data.data.photoUrl;
      setSuccess('¡Foto actualizada correctamente!');
      onPhotoUpdated(newPhotoUrl);
      setTimeout(() => setSuccess(''), 3000);
      setFile(null);
    } catch (err: any) {
      setError(formatError(err) || 'Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4 p-3 bg-light rounded border">
      <h5>📸 Actualiza tu foto de perfil</h5>

      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
      {success && <Alert variant="success" className="mt-2">{success}</Alert>}

      <Form onSubmit={handleUpload} className="mt-3">
        <Form.Group className="mb-3">
          <Form.Label>Seleccionar archivo</Form.Label>
          <Form.Control
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Form.Text className="text-muted">
            JPEG, PNG o WebP. Máximo 3MB.
          </Form.Text>
        </Form.Group>

        {preview && (
          <div className="text-center mb-3">
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '50%' }}
            />
          </div>
        )}

        <Button type="submit" variant="primary" disabled={!file || uploading}>
          {uploading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Subiendo...
            </>
          ) : (
            '⬆️ Subir Foto'
          )}
        </Button>
      </Form>
    </div>
  );
}
