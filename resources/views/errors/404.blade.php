<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Page Not Found</title>
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
            font-size: 5rem;
            margin-bottom: 0.5rem;
            color: #1f7a8c;
            margin-top: 0;
        }
        h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #444;
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
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Sorry, the page you are looking for could not be found.</p>
        <a href="{{ url('/') }}">Return to Homepage</a>
    </div>
</body>
</html>