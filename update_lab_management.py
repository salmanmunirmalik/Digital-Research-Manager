import re

# Read the file
with open('pages/LabManagementPage.tsx', 'r') as f:
    content = f.read()

# 1. Remove the Phylogenetic Team Tree description box
content = re.sub(
    r'<div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">.*?</div>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# 2. Replace all colored backgrounds with white + color dots
# PI - Purple dot
content = re.sub(
    r'<div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 shadow-xl border-4 border-purple-300">\s*<div className="flex flex-col items-center text-white">\s*<div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 border-4 border-white/30">',
    r'<div className="bg-white rounded-2xl p-6 shadow-md border border-gray-300">\n                        <div className="flex flex-col items-center text-gray-900">\n                          <div className="relative w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 border-4 border-gray-300">',
    content
)

# Add purple dot after PI emoji
content = re.sub(
    r'(<span className="text-3xl font-bold">👨‍🔬</span>)',
    r'\1\n                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white"></div>',
    content
)

# PostDoc/Masters - Blue dot
content = re.sub(
    r'<div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 shadow-lg border-2 border-blue-300">\s*<div className="flex flex-col items-center text-white">\s*<div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 border-2 border-white/30">',
    r'<div className="bg-white rounded-xl p-4 shadow-md border border-gray-300">\n                        <div className="flex flex-col items-center text-gray-900">\n                          <div className="relative w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2 border-2 border-gray-300">',
    content
)

# Add blue dot after PostDoc emojis
content = re.sub(
    r'(<span className="text-2xl">👨‍💻</span>)',
    r'\1\n                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>',
    content
)

# Graduate Students - Green dot
content = re.sub(
    r'<div className="bg-gradient-to-r from-indigo-400 to-purple-400 rounded-lg p-3 shadow-md border border-indigo-200">\s*<div className="flex flex-col items-center text-white">\s*<div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2">',
    r'<div className="bg-white rounded-lg p-3 shadow-md border border-gray-300">\n                        <div className="flex flex-col items-center text-gray-900">\n                          <div className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2 border border-gray-300">',
    content
)

# Add green dot after PhD student emojis
content = re.sub(
    r'(<span className="text-lg">🎓</span>)',
    r'\1\n                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>',
    content
)

# 3. Update all button colors to gray
replacements = [
    ('bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-gradient-to-r from-gray-700 to-gray-800'),
    ('bg-gradient-to-r from-green-600 to-emerald-600', 'bg-gradient-to-r from-gray-700 to-gray-800'),
    ('bg-gradient-to-r from-purple-600 to-pink-600', 'bg-gradient-to-r from-gray-700 to-gray-800'),
    ('bg-gradient-to-r from-yellow-600 to-orange-600', 'bg-gradient-to-r from-gray-700 to-gray-800'),
    ('bg-blue-600', 'bg-gray-700'),
    ('bg-green-600', 'bg-gray-700'),
    ('bg-purple-600', 'bg-gray-700'),
    ('hover:bg-blue-700', 'hover:bg-gray-800'),
    ('hover:bg-green-700', 'hover:bg-gray-800'),
    ('hover:bg-purple-700', 'hover:bg-gray-800'),
    ('hover:from-blue-700 hover:to-indigo-700', 'hover:from-gray-800 hover:to-gray-900'),
    ('hover:from-green-700 hover:to-emerald-700', 'hover:from-gray-800 hover:to-gray-900'),
    ('hover:from-purple-700 hover:to-pink-700', 'hover:from-gray-800 hover:to-gray-900'),
    ('hover:from-yellow-700 hover:to-orange-700', 'hover:from-gray-800 hover:to-gray-900'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write the file
with open('pages/LabManagementPage.tsx', 'w') as f:
    f.write(content)

print("Done!")

