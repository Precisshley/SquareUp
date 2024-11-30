import boto3

def upload_file(file_name, bucket):
    object_name = file_name
    s3_client = boto3.client('s3')
    extra_args = {
        'ContentType': 'image/jpeg'  # Adjust content type as needed (image/png, image/jpeg, etc.)
    }
    try:
        response = s3_client.upload_file(
            file_name, 
            bucket, 
            object_name,
            ExtraArgs=extra_args
        )
        return response
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return None

def show_image(bucket, filename=None):
    s3_client = boto3.client('s3')
    
    if filename is None:
        # List all objects in the bucket
        response = s3_client.list_objects_v2(Bucket=bucket)
        return response.get('Contents', [])
    else:
        # Get a specific image
        response = s3_client.get_object(Bucket=bucket, Key=filename)
        return response['Body'].read()