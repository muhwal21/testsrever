const { google } = require('googleapis');

// Konfigurasi Google Drive Service Account
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, '\n'); // Jika PRIVATE_KEY berisi karakter \n, harus di-replace
const FOLDER_ID = process.env.FOLDER_ID; // ID folder Google Drive tujuan

const jwtClient = new google.auth.JWT(
  SERVICE_ACCOUNT_EMAIL,
  null,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/drive.file']
);

// Fungsi untuk mengupload file ke Google Drive
async function uploadFileToDrive(fileName, fileContent) {
  await jwtClient.authorize();

  const drive = google.drive({ version: 'v3', auth: jwtClient });

  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID]
  };

  const media = {
    mimeType: 'text/plain',
    body: fileContent
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    return { success: true, fileId: response.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Serverless function handler
export default async (req, res) => {
  if (req.method === 'POST') {
    const { fileName, fileContent } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({ success: false, error: 'File name and content are required' });
    }

    const result = await uploadFileToDrive(fileName, fileContent);
    res.status(result.success ? 200 : 500).json(result);
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
};
