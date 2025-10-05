
async function testSearch() {
  console.log('🔍 Testing Deep Archive AI Search...\n');
  
  const testQuery = "pyramids in Antarctica";
  console.log(`Query: "${testQuery}"\n`);
  
  try {
    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testQuery,
        sources: ['cia', 'fbi', 'nara', 'nsa', 'wayback', 'web'],
        maxSources: 20,
        archiveYears: 25
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    console.log('✅ Search completed successfully!\n');
    console.log('📝 AI Response Preview:');
    console.log(data.message.substring(0, 500) + '...\n');
    
    console.log(`📚 Sources Found: ${data.sources.length}`);
    console.log('\nSource Breakdown:');
    
    const sourceTypes = data.sources.reduce((acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(sourceTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n🔗 Sample Sources:');
    data.sources.slice(0, 5).forEach((source, i) => {
      console.log(`  ${i + 1}. [${source.type.toUpperCase()}] ${source.title}`);
      console.log(`     ${source.url}\n`);
    });
    
    console.log(`💬 Conversation ID: ${data.conversationId}`);
    console.log(`✉️  Message ID: ${data.messageId}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSearch();
