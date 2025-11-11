# Zen API Automator

Next-level API automation tool with visual workflow builder, inspired by n8n but with enhanced capabilities for modern API integrations.

## Features

### 🚀 Core Capabilities
- **Visual Workflow Builder** - Drag-and-drop interface for creating complex API workflows
- **Multi-API Connections** - Connect to any REST API with custom authentication
- **cURL Request Builder** - Visual interface for building and testing API requests
- **Real-time Execution** - Live workflow execution with WebSocket updates
- **Phone Call Analysis** - Integrated communication features
- **Website Generation** - Automated website creation and deployment

### 🔧 Technical Features
- **Modern Stack** - Node.js, Express, Socket.IO, Vanilla JavaScript
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - WebSocket-based live execution monitoring
- **Component Library** - Extensible workflow components
- **API Testing** - Built-in request testing and validation

## Quick Start

1. **Install Dependencies**
   ```bash
   cd zen-api-automator
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open http://localhost:3000 in your browser

## Usage

### Dashboard
- Monitor active workflows and API connections
- View execution statistics and success rates
- Track recent activity and system health

### Workflow Builder
- Drag components from the palette to the canvas
- Configure each component with specific parameters
- Connect components to create automated workflows
- Execute workflows in real-time

### API Connections
- Add new API connections with custom authentication
- Test connection status and response times
- Manage credentials and security settings

### cURL Builder
- Build API requests visually
- Test endpoints with different methods and headers
- Generate cURL commands for documentation
- Export request configurations

## Workflow Components

### cURL Request
Execute HTTP requests to any REST API
- Methods: GET, POST, PUT, DELETE, PATCH
- Custom headers and authentication
- Request body configuration
- Response handling

### Phone Call Analysis
Analyze and process phone calls
- Call quality assessment
- Transcription services
- Sentiment analysis
- Duration tracking

### Website Generation
Create and deploy websites automatically
- Template selection
- Domain configuration
- Content generation
- Deployment automation

### Condition
Add conditional logic to workflows
- If/then/else branching
- Data-based decisions
- Error handling
- Route selection

### Delay
Add timing controls to workflows
- Fixed delays
- Conditional waits
- Rate limiting
- Scheduling

## API Integration

The application supports integration with any REST API. Common integrations include:

- **AI Services**: OpenAI, Anthropic, Cohere
- **Communication**: Twilio, SendGrid, Slack
- **Payment**: Stripe, PayPal, Square
- **Storage**: AWS S3, Google Cloud, Azure
- **Analytics**: Google Analytics, Mixpanel, Segment
- **CRM**: Salesforce, HubSpot, Pipedrive

## Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - CORS allowed origins

### API Keys
Add your API keys to the `.env` file:
```
OPENAI_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
STRIPE_SECRET_KEY=your_key_here
```

## Development

### Project Structure
```
zen-api-automator/
├── server.js              # Main server file
├── src/
│   └── api/
│       └── routes.js      # API routes
├── public/
│   ├── index.html         # Main HTML file
│   ├── styles/
│   │   └── main.css       # Styles
│   └── js/
│       └── app.js         # Frontend JavaScript
└── package.json           # Dependencies
```

### Adding New Components
1. Create component type in `public/js/app.js`
2. Add configuration UI in `getComponentConfig()`
3. Implement backend logic in `server.js`
4. Add execution logic in `executeStep()`

### API Endpoints
- `GET /api/connections` - List all connections
- `POST /api/test-connection` - Test API connection
- `POST /api/execute-curl` - Execute cURL request
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow

## Security

- Environment-based configuration
- CORS protection
- Input validation
- Secure credential storage
- Rate limiting (configurable)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

**Zen API Automator** - Next-level API automation for modern development workflows.