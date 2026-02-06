# API Runner

A modern, feature-rich API testing tool built with vanilla JavaScript. Test, organize, and document your APIs with ease - no backend required, everything runs in your browser!
Host this yourself, or run locally. No account required.

![API Runner](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)

## ✨ Features

### 🎯 Core Functionality
- **Multiple HTTP Methods** - Support for GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS
- **Request Builder** - Intuitive interface for building API requests
- **Query Parameters** - Easy-to-use key-value editor for URL parameters
- **Request Headers** - Custom header management with enable/disable toggles
- **Request Body** - Support for JSON, raw text, and form data
- **Response Viewer** - Beautifully formatted JSON responses with syntax highlighting

### 🔐 Authentication
- **No Auth** - For public APIs
- **Basic Auth** - Username and password authentication
- **Bearer Token** - JWT and OAuth token support
- **API Key** - Custom API key authentication

### 📁 Organization
- **Collections** - Organize requests into folders and sub-folders
- **Nested Folders** - Unlimited folder nesting for complex projects
- **Search** - Quickly find requests across all collections
- **Request History** - Automatic tracking of all sent requests
- **Tabs** - Work on multiple requests simultaneously

### 💾 Import/Export
- **Postman Compatible** - Import and export Postman collections (v2.1.0)
- **Folder Export** - Export individual folders or entire workspace
- **Request Export** - Export single requests as collections
- **Preserves Structure** - Maintains folder hierarchy on import/export

### 📟 Developer Console
- **Network Details** - View request/response timing and size
- **Request Headers** - Inspect all sent headers
- **Response Headers** - View all received headers
- **Response Body** - Full response data
- **Expandable Sections** - Drill down into specific details
- **Per-Request Logging** - Track multiple requests independently

### 💻 Code Generation
Generate production-ready code in **15+ languages and libraries**:

**JavaScript**
- Fetch API
- XMLHttpRequest
- jQuery

**Node.js**
- Axios
- Native HTTPS
- Request

**Python**
- Requests
- http.client

**Others**
- cURL (Command Line)
- Go (Native)
- Java (OkHttp)
- PHP (cURL, Guzzle)
- C# (HttpClient, RestSharp)

### 🎨 UI/UX
- **Dark Mode** - Easy on the eyes for long coding sessions
- **Resizable Panels** - Customize your workspace layout
- **Drag-to-Resize** - Adjust sidebar and console heights
- **Keyboard Shortcuts** - Work faster with keyboard navigation
- **Responsive Design** - Works on desktop and tablet screens

### 💡 Advanced Features
- **LocalStorage** - All data saved in browser (privacy-first)
- **No Backend Required** - Pure client-side application
- **CORS Handling** - Clear error messages for CORS issues
- **Response Actions** - Copy, download, or generate code from responses
- **Tab Management** - Open multiple requests, save with meaningful names

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HannibalZA/ApiRunner.git
   cd ApiRunner
   ```
2. **Open directly in browser**
   Simply open index.html in your default browser

   OR
3. **Serve up in a local web server**
   ```bash
   # Using Python 3
     python -m http.server 8000

   # Using Python 2
     python -m SimpleHTTPServer 8000

   # Using Node.js http-server
     npx http-server -p 8000

   # Using PHP
     php -S localhost:8000
   ```


**📖 Usage Guide**
Making Your First Request

 Enter the URL
 - Click in the URL field and enter your API endpoint
 - Example: https://api.github.com/users/octocat

  Select HTTP Method
 - Use the dropdown to select: GET, POST, PUT, DELETE, PATCH, HEAD, or OPTIONS
 - Default is GET

  Add Query Parameters (Optional)
 - Click the Params tab
 - Click + Add Parameter
 - Enter key-value pairs
 - Toggle checkbox to enable/disable parameters

  Configure Headers (Optional)
 - Click the Headers tab
 - Add custom headers like Content-Type, Accept, etc.
 - Pre-filled with Content-Type: application/json

  Add Request Body (For POST/PUT/PATCH)
 - Click the Body tab
 - Choose body type: None, JSON, Raw Text, or Form Data
 - Enter your request payload

  Configure Authentication (Optional)
 - Click the Authorization tab
 - Choose: No Auth, Basic Auth, Bearer Token, or API Key
 - Enter credentials

  Send the Request
 - Click the blue Send button
 - View formatted response with syntax highlighting
 - Check status code, response time, and size

  Save the Request (Optional)
 - Click Save button
 - Enter a name for the request
 - Choose a folder or save to root
 - Request is now in your Collections

Managing Collections

Creating Folders
 - Click the folder (+) icon in the sidebar header
 - Enter folder name
 - Optionally select a parent folder for nesting
 - Click Create

Organizing Requests
 - Drag and Drop: Not yet supported (coming soon!)
 - Save to Folder: When saving a request, select destination folder
 - Nested Folders: Create folders within folders (unlimited depth)
 - Folder Actions: Hover over folder to see Export and Delete options

Searching Collections
 - Use the search bar at the top of the sidebar
 - Searches through folder names and request names
 - Automatically expands matching folders
 - Real-time filtering as you type

Working with Tabs

Creating Tabs
 - Click the + button in the tab bar
 - Or press Ctrl/Cmd + T (coming soon)
 - Each tab maintains independent request state

Switching Tabs
 - Click on any tab to switch
 - Active tab is highlighted with white background

Closing Tabs
 - Click the × button on any tab
 - Must keep at least one tab open
 - Unsaved changes are not preserved (auto-save coming soon)

Tab Features
 - Each tab has its own request configuration
 - Tabs persist request/response state
 - Named tabs after saving requests
 - Visual method badges (GET, POST, etc.)

**Import & Export**

Importing Postman Collections
 - Click the three-dot menu (⋯) in sidebar header
 - Select Import Collection
 - Choose your Postman .json file (v2.1.0 format)
 - Collection is imported with:
        ✅ Original folder structure preserved
        ✅ All requests with methods, URLs, headers
        ✅ Request bodies and authentication
        ✅ Query parameters
 - New root folder created with collection name
 - Success message shows number of imported requests

**Exporting Collections**

Export All Collections:
 - Click menu (⋯) → Export All Collections
 - Enter collection name (default: "My API Collection")
 - Add optional description
 - Click Export
 - Downloads as .postman_collection.json

Export Single Folder:
 - Hover over any folder
 - Click the export icon (↑)
 - Enter export name (defaults to folder name)
 - Downloads folder with all nested content
 - Import directly into Postman!

Export Single Request:
 - Hover over any request
 - Click the export icon (↑)
 - Exports as single-request collection
 - Perfect for sharing specific endpoints

**Export Format**

All exports use Postman Collection v2.1.0 format:
 - Fully compatible with Postman
 - Can be imported into Insomnia
 - Standard JSON format for version control
 - Preserves all request details

**Using the Developer Console**

Opening the Console
 - Click Console button at bottom of screen
 - Or send any request (auto-opens on first request)
 - Drag top edge to resize height

**Console Features**

Request Logging:
 - Each request appears as a collapsible row
 - Shows: Method, URL, Status Code, Response Time
 - Color-coded status (green = success, red = error)
 - Newest requests at bottom (auto-scroll)

Expandable Sections:
 - Network - Request URL, method, status, timing, size
 - Request Headers - All headers sent with request
 - Response Headers - All headers received from server
 - Response Body - Full response data with syntax highlighting

Console Actions:
 - Clear - Removes all console entries
 - Close (×) - Hides console panel
 - Resize - Drag top border to adjust height

Console Behavior:
 - Tracks all requests in current session
 - Cleared on page refresh (not persisted)
 - Independent per tab (coming soon)
 - Min height: 100px, Max height: 80% of viewport

**Request History**

Accessing History
 - Click History in the sidebar navigation
 - View all previously sent requests
 - Sorted by most recent first
 - Shows: Method, URL, Timestamp

Using History
 - Click any item to load request into current tab
 - Hover to see delete button (×)
 - Stores up to 50 most recent requests
 - Older requests automatically removed

**History Data**

Each history entry includes:
 - Full request configuration (method, URL, headers, body, auth)
 - Response status code
 - Response time
 - Timestamp

Note: History is cleared when:
 - Browser cache is cleared
 - LocalStorage is reset
 - Manually deleted from history panel

**Code Generation**

Generating Code
 - Send any request first
 - Click the Code button in response actions area
 - Modal opens with code generation options

Selecting Language

Use the dropdown to choose from:
JavaScript:
 - Fetch API (default)
 - XMLHttpRequest
 - jQuery

Node.js:
 - Axios
 - Native HTTPS
 - Request library

Python:
 - Requests library
 - http.client

Command Line:
 - cURL

Go:
 - Native net/http

Java:
 - OkHttp

PHP:
 - cURL
 - Guzzle

C#:
 - HttpClient
 - RestSharp

Using Generated Code

 - Select your preferred language/library
 - Code automatically updates in preview
 - Click Copy Code button
 - Paste directly into your project
 - Code includes:
        ✅ Request method and URL
        ✅ All headers
        ✅ Request body (if applicable)
        ✅ Basic error handling
        ✅ Response parsing

Code Features:
 - Production-ready snippets
 - Includes necessary imports
 - Proper error handling
 - Copy-paste ready
 - Follows language best practices

**Customizing Your Workspace**

Resizing Panels

Sidebar Width:
 - Hover over right edge of sidebar
 - Cursor changes to resize indicator (↔)
 - Click and drag to adjust width
 - Min: 200px, Max: 600px

Console Height:
 - Hover over top edge of console panel
 - Cursor changes to resize indicator (↕)
 - Click and drag to adjust height
 - Min: 100px, Max: 80% of screen

Panel Sizes:
 - Persist during session
 - Reset on page refresh
 - Independent of zoom level

**Dark Mode**

Toggle Dark Mode:
 - Click Dark/Light button in header
 - Instant theme switch
 - Preference saved to LocalStorage
 - Persists across sessions

Dark Mode Features:
 - Eye-friendly dark colors
 - Syntax highlighting optimized for dark background
 - All UI elements themed consistently
 - Reduced eye strain for long sessions

**Search & Filter**

Search Collections:
 - Type in search bar above collections
 - Filters folders and requests in real-time
 - Auto-expands parent folders
 - Clear search to restore full view

**🔧 Advanced Features**

Authentication Methods

Basic Authentication
 - Select Basic Auth in Authorization tab
 - Enter Username
 - Enter Password
 - Automatically encodes credentials in Base64
 - Adds Authorization: Basic <encoded> header

Bearer Token
 - Select Bearer Token in Authorization tab
 - Paste your JWT or OAuth token
 - Adds Authorization: Bearer <token> header
 - Common for REST APIs and OAuth 2.0

API Key
 - Select API Key in Authorization tab
 - Enter Key Name (e.g., X-API-Key, api-key)
 - Enter Key Value (your API key)
 - Adds custom header with your key

Request Body Types

JSON Body
 - Most common for REST APIs
 - Automatic syntax validation (coming soon)
 - Syntax highlighting in editor
 - Automatically sets Content-Type: application/json

Raw Text
 - Plain text payloads
 - XML, CSV, or any text format
 - No automatic content-type header

Form Data
 - Key-value pairs
 - Mimics HTML form submission
 - Sets Content-Type: application/x-www-form-urlencoded
 - Add multiple fields with +Add Field button

None
 - For GET, DELETE, HEAD requests
 - No request body sent

**Response Handling**

Response Tabs

Body Tab:
 - Formatted JSON with syntax highlighting
 - Color-coded: keys (blue), strings (green), numbers (orange)
 - Copy and Download buttons
 - Pretty-printed with indentation

Headers Tab:
 - All response headers in table format
 - Includes server info, content-type, cache headers
 - Easy to read key-value pairs

Code Tab:
 - Quick access to code generation
 - Generate code based on the request that was sent

**Response Information**

Displayed above response tabs:
 - Status Code - With color coding (green=2xx, red=4xx/5xx)
 - Response Time - In milliseconds
 - Response Size - In bytes

**💾 Data Storage**

What's Stored

API Runner stores the following in browser LocalStorage:
 - Collections - All saved requests and parameters
 - Folders - Folder structure and hierarchy
 - History - Last 50 requests (method, URL, timestamp)
 - Theme Preference - Dark or light mode
 - Tab State - Currently open tabs (coming soon)

What's NOT Stored
 - Responses - Not persisted (too large)
 - Console Logs - Cleared on refresh

Data Limits
 - LocalStorage limit: 5-10MB (browser dependent)
 - Typical usage: < 1MB for 100s of requests
 - No cloud sync (privacy-first approach)

**Clearing Data**

Clear All Data:
 - Open browser DevTools (F12)
 - Go to Application/Storage tab
 - Expand Local Storage
 - Right-click domain → Clear
 - Refresh page

Selective Deletion:
 - Delete individual requests via UI
 - Delete folders (and contents) via UI
 - Clear history via clear button

**Backup Your Data**

Export Everything:
 - Use Export All Collections feature
 - Save JSON file to safe location
 - Version control with Git (recommended)
 - Re-import anytime

**🌐 Browser Compatibility**

Supported Browsers

Browser	Version	Status
 - Chrome	90+	✅ Fully Supported
 - Firefox	88+	✅ Fully Supported
 - Safari	14+	✅ Fully Supported
 - Edge	90+	✅ Fully Supported
 - Opera	76+	✅ Fully Supported
 - 
Required Features
 - ES6+ JavaScript support
 - LocalStorage API
 - Fetch API
 - CSS Grid & Flexbox
 - CSS Custom Properties

Known Limitations
 - CORS: Same-origin policy applies (browser security)
 - File Upload: Not supported in body
 - Cookies: Managed by browser, not modifiable
 - Binary Data: Limited support
 - Streaming: Not supported

**🐛 Troubleshooting**

Common Issues

"Failed to fetch" Error:
 - Cause: CORS policy blocking request
 - Solution:
        Use CORS proxy for testing
        Enable CORS on API server
        Use browser extension to disable CORS (dev only)

Request Not Saving:
 - Cause: LocalStorage full or disabled
 - Solution:
        Clear browser cache
        Check LocalStorage isn't disabled
        Export data and re-import

Dark Mode Not Persisting:
 - Cause: Cookies/LocalStorage blocked
 - Solution: Enable LocalStorage in browser settings

Collection Not Importing:
 - Cause: Invalid JSON or unsupported format
 - Solution:
        Ensure Postman Collection v2.1.0 format
        Validate JSON syntax
        Check file isn't corrupted

Sidebar/Console Won't Resize:
 - Cause: Min/max limits reached
 - Solution: Limits are 200-600px (sidebar), 100px-80vh (console)

### Support the Project

If you find API Runner useful:

-   ⭐ **Star** the repository
-   🐦 **Tweet** about it
-   📝 **Write** a blog post
-   💬 **Share** with colleagues
-   🤝 **Contribute** code or docs

**Made with ❤️ for the developer community**

_Simple • Fast • Free • Open Source_
