'use client'; // ✅ This is the fix. It tells Next.js to run this component in the browser.

export default function ContactPage() {
  // Now that this is a Client Component, using onSubmit is allowed.
  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Form submitted! (This is a demo)');
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Contact Us</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            id="name" 
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" 
            placeholder="Your Name" 
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            id="email" 
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" 
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
          <textarea 
            id="message" 
            rows="4" 
            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3" 
            placeholder="Your message..."
          ></textarea>
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}