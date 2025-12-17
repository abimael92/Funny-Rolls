import { NextRequest, NextResponse } from 'next/server';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
	region: process.env.AWS_REGION || 'eu-west-1',
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		const fileName = `recipe-${Date.now()}-${Math.random()
			.toString(36)
			.substring(2)}.${file.name.split('.').pop()}`;
		const bucketName = process.env.AWS_S3_BUCKET || 'funny-rolls';

		const arrayBuffer = await file.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		const params = {
			Bucket: bucketName,
			Key: `recipe-images/${fileName}`,
			Body: uint8Array,
			ContentType: file.type,
			ACL: 'public-read' as const,
		};

		await s3Client.send(new PutObjectCommand(params));

		const url = `https://${bucketName}.s3.${
			process.env.AWS_REGION || 'eu-west-1'
		}.amazonaws.com/recipe-images/${fileName}`;

   console.log('Upload SUCCESS:', url); // ADD THIS
    return NextResponse.json({ url });
	} catch (error) {
		console.error('Upload error:', error);
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { url } = await request.json();

		if (!url) {
			return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
		}

		const bucketName = process.env.AWS_S3_BUCKET || 'funny-rolls';
		const urlParts = url.split('/');
		const key = urlParts.slice(3).join('/');

		const params = {
			Bucket: bucketName,
			Key: key,
		};

		await s3Client.send(new DeleteObjectCommand(params));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete error:', error);
		return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
	}
}
