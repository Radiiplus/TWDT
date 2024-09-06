<script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"></script>
<script src="src/dloader.js"></script>

<script>
// Global loader instance with default options
const globalLoader = new DynamicLoader({ color: 'green', size: 'big', type: 'spinner' });
globalLoader.wrapFetch(); // Wraps all fetch requests globally

// Loader instance for a specific container element
const containerElement = document.getElementById('container');
const containerLoader = new DynamicLoader({
    color: 'blue',
    size: 'smallest',
    type: 'spinner',
    useOverlay: true,
    targetElement: containerElement
});

// Fetch data example
async function fetchData() {
    try {
        const response = await fetch('/chat');
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Container async function wrapped with loader
const containerAsyncFunction = containerLoader.wrapFunction(async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'Container operation done!';
});

// Event listeners for buttons (with or without button elements)
const fetchButton = document.getElementById('fetchButton');
if (fetchButton) {
    fetchButton.addEventListener('click', fetchData);
}

const containerButton = document.getElementById('containerButton');
if (containerButton) {
    containerButton.addEventListener('click', async () => {
        const result = await containerAsyncFunction();
        console.log(result);
    });
}

// Optional: Trigger loader automatically if no button exists
if (!fetchButton) {
    fetchData(); // Automatically fetch data if no fetch button is present
}

if (!containerButton) {
    (async () => {
        const result = await containerAsyncFunction();
        console.log(result);
    })(); // Automatically trigger container async function if no container button exists
}
</script>
