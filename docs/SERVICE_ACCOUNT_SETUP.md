# Google Service Account Setup Guide

This guide explains how to create a Google service account to allow the Python script to upload schedules to Google Sheets automatically.

## Overview

A service account is a special type of Google account that belongs to your application instead of an individual user. It allows your Python script to authenticate and access Google Sheets without requiring manual login.

## Step-by-Step Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click **"New Project"**
5. Enter a project name (e.g., "On-Call-Scheduler")
6. Click **"Create"**
7. Wait for the project to be created (you'll see a notification)
8. Make sure the new project is selected in the dropdown

### Step 2: Enable Required APIs

You need to enable two APIs for your project:

#### Enable Google Sheets API:
1. In the Google Cloud Console, click on the hamburger menu (☰) in the top-left
2. Navigate to **"APIs & Services"** → **"Library"**
3. In the search box, type **"Google Sheets API"**
4. Click on **"Google Sheets API"** from the results
5. Click the **"Enable"** button
6. Wait for it to be enabled

#### Enable Google Drive API:
1. Click the back arrow or go back to the API Library
2. In the search box, type **"Google Drive API"**
3. Click on **"Google Drive API"** from the results
4. Click the **"Enable"** button
5. Wait for it to be enabled

### Step 3: Create Service Account

1. In the Google Cloud Console, click the hamburger menu (☰)
2. Navigate to **"IAM & Admin"** → **"Service Accounts"**
3. Click **"+ Create Service Account"** at the top
4. Fill in the service account details:
   - **Service account name**: `on-call-scheduler` (or any name you prefer)
   - **Service account ID**: This will auto-generate (e.g., `on-call-scheduler@your-project.iam.gserviceaccount.com`)
   - **Description**: "Service account for uploading on-call schedules to Google Sheets"
5. Click **"Create and Continue"**
6. For "Grant this service account access to project" - you can skip this (click **"Continue"**)
7. For "Grant users access to this service account" - you can skip this (click **"Done"**)

### Step 4: Create and Download Credentials

1. You should now see your service account in the list
2. Click on the service account email (the one that looks like `on-call-scheduler@your-project.iam.gserviceaccount.com`)
3. Go to the **"Keys"** tab at the top
4. Click **"Add Key"** → **"Create new key"**
5. Select **"JSON"** as the key type
6. Click **"Create"**
7. A JSON file will automatically download to your computer
8. **Important**: Rename this file to `google-credentials.json`
9. Move this file to your project directory: `/Users/ohadeliyahou/Documents/new repo/ohad_tools/`
10. **Security Note**: Keep this file secure! Don't share it or commit it to Git. It contains credentials that give access to your Google account.

### Step 5: Share Your Spreadsheet with the Service Account

This is a critical step! The service account needs permission to edit your spreadsheet.

1. Open the `google-credentials.json` file in a text editor
2. Find the `"client_email"` field - it will look something like:
   ```
   "client_email": "on-call-scheduler@your-project.iam.gserviceaccount.com"
   ```
3. Copy this email address
4. Open your Google Sheets spreadsheet ("On Call Schedule") in your browser
5. Click the **"Share"** button in the top-right corner
6. Paste the service account email address
7. Make sure the permission is set to **"Editor"** (not Viewer)
8. **Uncheck** "Notify people" (no need to send email to a service account)
9. Click **"Share"** or **"Done"**

### Step 6: Get Your Spreadsheet ID

1. Open your Google Sheets spreadsheet in your browser
2. Look at the URL in the address bar. It will look like:
   ```
   https://docs.google.com/spreadsheets/d/1abc123def456ghi789jkl012mno345pqr678stu/edit
   ```
3. The spreadsheet ID is the long string between `/d/` and `/edit`
   - In the example above: `1abc123def456ghi789jkl012mno345pqr678stu`
4. Copy this ID

### Step 7: Configure Your Application

1. In your project directory, you should have a file called `config.json.template`
2. Copy it to create your actual config file:
   ```bash
   cp config.json.template config.json
   ```
3. Open `config.json` in a text editor
4. Replace `"YOUR_SPREADSHEET_ID_HERE"` with the spreadsheet ID you copied in Step 6
5. The file should look like:
   ```json
   {
     "spreadsheet_id": "1abc123def456ghi789jkl012mno345pqr678stu",
     "worksheet_name": "2026",
     "credentials_file": "google-credentials.json",
     "upload_to_sheets": true
   }
   ```
6. Save the file

### Step 8: Test the Connection

1. Make sure you have the required Python packages installed:
   ```bash
   pip install gspread oauth2client pandas
   ```

2. Run your script to test:
   ```bash
   python on_call_scheduler_with_sheets.py
   ```

3. If everything is set up correctly:
   - The script will generate the schedule
   - It will upload to Google Sheets
   - You'll see a message: "Schedule successfully uploaded to Google Sheets"
   - Check your spreadsheet to verify the data was added

## Troubleshooting

### Error: "gspread.exceptions.APIError: {'code': 403, 'message': 'The caller does not have permission'}"

**Solution**: You didn't share the spreadsheet with the service account email. Go back to Step 5.

### Error: "gspread.exceptions.SpreadsheetNotFound"

**Solution**: Check that your spreadsheet ID in `config.json` is correct. Go back to Step 6.

### Error: "FileNotFoundError: [Errno 2] No such file or directory: 'google-credentials.json'"

**Solution**: Make sure the `google-credentials.json` file is in the same directory as your Python script.

### Error: "gspread.exceptions.APIError: {'code': 403, 'message': 'Google Sheets API has not been used in project...'}"

**Solution**: You need to enable the Google Sheets API. Go back to Step 2.

## Security Best Practices

1. **Never commit credentials to Git**:
   - Add `google-credentials.json` to your `.gitignore` file
   - Add `config.json` to your `.gitignore` file
   - Only commit `config.json.template`

2. **Limit service account access**:
   - Only share specific spreadsheets with the service account
   - Don't share your entire Google Drive

3. **Rotate credentials periodically**:
   - If credentials are compromised, delete the old key in Google Cloud Console
   - Create a new key following Step 4

4. **Backup your credentials**:
   - Keep a secure backup of `google-credentials.json`
   - If you lose it, you'll need to create a new key

## Summary

After completing these steps, you should have:
- ✅ A Google Cloud project with APIs enabled
- ✅ A service account created
- ✅ `google-credentials.json` file in your project directory
- ✅ Your spreadsheet shared with the service account
- ✅ `config.json` file with correct spreadsheet ID
- ✅ Successfully tested the upload functionality

Your Python script can now automatically upload schedules to Google Sheets without requiring manual authentication!
