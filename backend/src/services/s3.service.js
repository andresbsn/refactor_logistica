const { Upload } = require('@aws-sdk/lib-storage');
const { HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3Client, bucketName } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Uploads a file to S3
 * @param {Express.Multer.File} file - The file to upload
 * @param {string} customPath - Optional custom path (e.g., 'images/reclamos/123/antes.jpg')
 * @returns {Promise<Object>} - The upload result containing the URL
 */
const uploadFile = async (file, customPath = null) => {
  let fileName;
  
  if (customPath) {
    fileName = customPath;
  } else {
    fileName = `tickets/${uuidv4()}${path.extname(file.originalname)}`;
  }
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    },
  });

  await upload.done();

  const publicBase = process.env.S3_PUBLIC_BASE;
  let url;
  
  if (publicBase) {
    url = `${publicBase.replace(/\/+$/, '')}/${fileName}`;
  } else {
    let endpoint = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
    url = endpoint.includes(`/${bucketName}`) 
      ? `${endpoint}/${fileName}`
      : `${endpoint}/${bucketName}/${fileName}`;
  }

  return {
    url,
    key: fileName,
  };
};

/**
 * Checks if a file exists in S3 by prefix (e.g., 'reclamos/123/')
 * @param {string} prefix - The prefix to search for
 * @returns {Promise<Object|null>} - The file info if found, null otherwise
 */
const checkFileExists = async (prefix) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 10,
    });

    const response = await s3Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      const file = response.Contents[0];
      const publicBase = process.env.S3_PUBLIC_BASE;
      let url;
      
      if (publicBase) {
        url = `${publicBase.replace(/\/+$/, '')}/${file.Key}`;
      } else {
        let endpoint = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
        url = endpoint.includes(`/${bucketName}`) 
          ? `${endpoint}/${file.Key}`
          : `${endpoint}/${bucketName}/${file.Key}`;
      }
      
      return {
        exists: true,
        key: file.Key,
        url,
        lastModified: file.LastModified,
        size: file.Size,
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('Error checking file in S3:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Lists all files in S3 by prefix (e.g., 'reclamos/123/')
 * @param {string} prefix - The prefix to search for
 * @returns {Promise<Array>} - Array of file info objects
 */
const listFilesByPrefix = async (prefix) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 20,
    });

    const response = await s3Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      const publicBase = process.env.S3_PUBLIC_BASE;
      
      const files = response.Contents.map((file) => {
        let url;
        if (publicBase) {
          url = `${publicBase.replace(/\/+$/, '')}/${file.Key}`;
        } else {
          let endpoint = (process.env.S3_ENDPOINT || '').replace(/\/+$/, '');
          url = endpoint.includes(`/${bucketName}`) 
            ? `${endpoint}/${file.Key}`
            : `${endpoint}/${bucketName}/${file.Key}`;
        }
        
        const key = file.Key;
        const fileName = key.split('/').pop().toLowerCase();
        const isBefore = fileName.includes('antes') || fileName.includes('before') || fileName.includes('antes_') || fileName.includes('before_');
        const isAfter = fileName.includes('despues') || fileName.includes('after') || fileName.includes('despues_') || fileName.includes('after_');
        
        return {
          key: file.Key,
          url,
          fileName: file.Key.split('/').pop(),
          lastModified: file.LastModified,
          size: file.Size,
          type: isBefore ? 'before' : isAfter ? 'after' : 'other',
        };
      });
      
      return files;
    }
    
    return [];
  } catch (error) {
    console.error('Error listing files in S3:', error);
    return [];
  }
};

module.exports = {
  uploadFile,
  checkFileExists,
  listFilesByPrefix,
};
