import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { Research } from './models/Research.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/company-research'

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes

// Save research data
app.post('/api/research', async (req, res) => {
  try {
    const { companyName, data } = req.body

    if (!companyName || !data) {
      return res.status(400).json({ message: 'Company name and data are required' })
    }

    const research = new Research({
      companyName,
      data,
    })

    const savedResearch = await research.save()
    res.json({
      id: savedResearch._id,
      companyName: savedResearch.companyName,
      data: savedResearch.data,
      createdAt: savedResearch.createdAt,
    })
  } catch (error) {
    console.error('Error saving research:', error)
    res.status(500).json({ message: 'Error saving research data', error: error.message })
  }
})

// Get research by ID
app.get('/api/research/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid research ID' })
    }

    const research = await Research.findById(id)

    if (!research) {
      return res.status(404).json({ message: 'Research not found' })
    }

    res.json({
      id: research._id,
      companyName: research.companyName,
      data: research.data,
      createdAt: research.createdAt,
    })
  } catch (error) {
    console.error('Error fetching research:', error)
    res.status(500).json({ message: 'Error fetching research data', error: error.message })
  }
})

// Get all research (for history)
app.get('/api/research', async (req, res) => {
  try {
    const researchList = await Research.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id companyName createdAt')

    res.json(researchList)
  } catch (error) {
    console.error('Error fetching research list:', error)
    res.status(500).json({ message: 'Error fetching research list', error: error.message })
  }
})

// Generate account plan (proxies to Python API)
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { company, research } = req.body

    if (!company || !research) {
      return res.status(400).json({ message: 'Company and research are required' })
    }

    // Call Python FastAPI to generate plan
    const axios = (await import('axios')).default
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000'
    
    const response = await axios.post(`${pythonApiUrl}/plan/generate`, {
      company,
      research,
    })

    res.json(response.data)
  } catch (error) {
    console.error('Error generating account plan:', error)
    res.status(500).json({ 
      message: 'Error generating account plan', 
      error: error.message 
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

