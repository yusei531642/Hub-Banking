fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'Hub-Banking'
description 'Custom bank UI with deposit/withdraw at bank locations'
version '1.0.0'

shared_scripts {
    'locales/*.lua',
    'config.lua'
}

client_scripts {
    '@PolyZone/client.lua',
    '@PolyZone/BoxZone.lua',
    '@PolyZone/EntityZone.lua',
    '@PolyZone/CircleZone.lua',
    '@PolyZone/ComboZone.lua',
    'client.lua'
}

server_scripts {
    'server.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/script.js'
}
