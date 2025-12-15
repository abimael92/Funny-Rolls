import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
	region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-1',
	credentials: {
		accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
	},
});

const s3 = new AWS.S3();

// Generate a unique file name
export const generateFileName = (originalName: string): string => {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const sanitizedName = originalName.replace(/[^a-zA-Z0-9.]/g, '-');
	const extension = sanitizedName.split('.').pop()?.toLowerCase() || 'jpg';
	return `recipe-${timestamp}-${randomString}.${extension}`;
};

// Upload file to S3
export const uploadFileToS3 = async (file: File): Promise<string> => {
	try {
		const fileName = generateFileName(file.name);

		const params = {
			Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'funny-rolls',
			Key: `recipe-images/${fileName}`,
			Body: file,
			ContentType: file.type,
			ACL: 'public-read',
		};

		const data = await s3.upload(params).promise();

		// Return the public URL
		return data.Location;
	} catch (error) {
		console.error('Error uploading to S3:', error);
		throw new Error('Failed to upload image. Please try again.');
	}
};

// Delete file from S3
export const deleteFileFromS3 = async (url: string): Promise<void> => {
	try {
		// Extract the key from the URL
		const urlParts = url.split('/');
		const key = urlParts[urlParts.length - 1];

		const params = {
			Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'funny-rolls',
			Key: `recipe-images/${key}`,
		};

		await s3.deleteObject(params).promise();
	} catch (error) {
		console.error('Error deleting from S3:', error);
		// Don't throw error here - just log it
	}
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; message: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
        return { 
            isValid: false, 
            message: 'Solo se permiten imágenes (JPEG, PNG, GIF, WebP)' 
        }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
        return { 
            isValid: false, 
            message: 'La imagen debe ser menor a 5MB' 
        }
    }

    return { isValid: true, message: 'Archivo válido' }
}
