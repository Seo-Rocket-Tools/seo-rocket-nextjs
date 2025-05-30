#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function addSoftware() {
  try {
    // Load current data
    const dataPath = path.join(__dirname, 'software.json');
    const currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('🚀 Adding new software to SEO Rocket\n');
    
    // Collect software information
    const name = await question('Software name: ');
    const icon = await question('Icon (emoji): ');
    const description = await question('Description: ');
    const tagsInput = await question('Tags (comma-separated): ');
    const tags = tagsInput.split(',').map(tag => tag.trim());
    const pricing = await question('Pricing (free/premium/freemium): ');
    const url = await question('URL (optional, press enter for #): ') || '#';
    
    // Generate ID from name
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Create new software object
    const newSoftware = {
      id,
      name,
      icon,
      description,
      tags,
      status: 'active',
      releaseDate: new Date().toISOString().split('T')[0],
      featured: true,
      url,
      pricing
    };
    
    // Add to software array
    currentData.software.push(newSoftware);
    
    // Update metadata
    currentData.metadata.totalSoftware = currentData.software.length;
    currentData.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Update tags if new ones were added
    tags.forEach(tag => {
      if (!currentData.tags.includes(tag)) {
        currentData.tags.push(tag);
      }
    });
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
    
    console.log('\n✅ Software added successfully!');
    console.log(`📊 Total software: ${currentData.software.length}`);
    console.log(`🆔 Generated ID: ${id}`);
    
  } catch (error) {
    console.error('❌ Error adding software:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
addSoftware(); 