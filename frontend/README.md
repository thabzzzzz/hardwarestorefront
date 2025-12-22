# HardwareStore Frontend

Quick dev steps:

```bash
cd hardwarestore/frontend
npm install
npm run dev
```

Open `http://localhost:3000` to view the Next.js homepage.

Image processing (local workflow)

1. Put your original full-size images into `public/_incoming/` (create the folder if missing).

2. Install Sharp (one-time):

```powershell
cd frontend
npm install --save-dev sharp
```

3. Run the script to process for a product (example for `prod-0001`):

```powershell
# move the downloaded file into the incoming folder
mkdir .\public\_incoming -ErrorAction SilentlyContinue
Move-Item -Path C:\path\to\downloaded\nzxt-h1-original.jpg -Destination .\public\_incoming\nzxt-h1-original.jpg

# run the processor
node .\scripts\process-images.js prod-0001 nzxt-h1-original.jpg
```

4. The script saves optimized files to `public/products/prod-0001/` and prints a JSON mapping you can paste into the `images` array for that product in `frontend/data/products.json`.

5. After confirming outputs, remove the original from `_incoming`.
