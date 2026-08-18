# InventoryManager

A C#/.NET companion inventory management app for the Wootclone storefront.

## Project structure

```
InventoryManager/
├── InventoryManager.sln
├── src/
│   └── InventoryManager.Api/    ASP.NET Core Web API
└── README.md
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- PostgreSQL (the same database used by the storefront)

## Build and run

```bash
cd c:\Users\Thabiso\projects\HWStore\InventoryManager
dotnet build
dotnet run --project src/InventoryManager.Api
```

The API will listen on `http://localhost:5120` (HTTP) and `https://localhost:7120` (HTTPS) by default.

## Add the mobile app

Once the API is in place, create a .NET MAUI or Blazor Hybrid project next to it:

```bash
dotnet new maui -n InventoryManager.Mobile -o src/InventoryManager.Mobile
dotnet sln add src/InventoryManager.Mobile/InventoryManager.Mobile.csproj
```

Then reference the API base URL and build the mobile UI.

## Open in the IDE

- Keep the storefront project open in this window.
- Open a second VS Code window (`File > New Window`) and open `c:\Users\Thabiso\projects\HWStore\InventoryManager`.
- Alternatively, add the folder to the current workspace with `File > Add Folder to Workspace`.
