<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Product Not Found</title>
    <style>
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f4f4f6;
            color: #333;
            height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: #fff;
            padding: 3rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            max-width: 500px;
            width: 90%;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #1f7a8c;
        }
        p {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.5;
        }
        a {
            display: inline-block;
            background-color: #111;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        a:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Product Unavailable</h1>
        <p>Sorry, the hardware component you are looking for does not exist in our database or has been removed.</p>
        <a href="{{ url('/') }}">Return Home</a>
    </div>
</body>
</html>