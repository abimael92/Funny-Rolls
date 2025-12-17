export const uploadFileToS3 = async (file: File): Promise<string> => {
	try {
		const formData = new FormData();
		formData.append('file', file);

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			throw new Error('Upload failed');
		}

		const data = await response.json();
		return data.url;
	} catch (error) {
		console.error('Error uploading to S3:', error);
		throw new Error('Failed to upload image. Please try again.');
	}
};

export const deleteFileFromS3 = async (url: string): Promise<void> => {
	try {
		const response = await fetch('/api/upload', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url }),
		});

		if (!response.ok) {
			console.error('Delete failed');
		}
	} catch (error) {
		console.error('Error deleting from S3:', error);
	}
};

export const validateImageFile = (
	file: File
): { isValid: boolean; message: string } => {
	const validTypes = [
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/gif',
		'image/webp',
	];
	if (!validTypes.includes(file.type)) {
		return {
			isValid: false,
			message: 'Solo se permiten imágenes (JPEG, PNG, GIF, WebP)',
		};
	}

	const maxSize = 5 * 1024 * 1024;
	if (file.size > maxSize) {
		return {
			isValid: false,
			message: 'La imagen debe ser menor a 5MB',
		};
	}

	return { isValid: true, message: 'Archivo válido' };
};
