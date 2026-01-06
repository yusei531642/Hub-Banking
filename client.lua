local QBCore = exports['qb-core']:GetCoreObject()
local zones = {}
local isPlayerInsideBankZone = false
local isUiOpen = false
local Text = Config.text or {}

local function OpenBank()
    if isUiOpen then return end
    QBCore.Functions.TriggerCallback('hub-banking:server:getData', function(data)
        if not data then return end
        isUiOpen = true
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'open',
            data = data,
            locale = Text.ui or {}
        })
    end)
end

RegisterNUICallback('close', function(_, cb)
    isUiOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('deposit', function(data, cb)
    QBCore.Functions.TriggerCallback('hub-banking:server:deposit', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('withdraw', function(data, cb)
    QBCore.Functions.TriggerCallback('hub-banking:server:withdraw', function(result)
        cb(result)
    end, data)
end)

CreateThread(function()
    if not Config.showBlips then return end
    for i = 1, #Config.locations do
        local blip = AddBlipForCoord(Config.locations[i])
        SetBlipSprite(blip, Config.blipInfo.sprite)
        SetBlipDisplay(blip, 4)
        SetBlipScale(blip, Config.blipInfo.scale)
        SetBlipColour(blip, Config.blipInfo.color)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(tostring(Config.blipInfo.name))
        EndTextCommandSetBlipName(blip)
    end
end)

CreateThread(function()
    for i = 1, #Config.locations do
        local zone = CircleZone:Create(Config.locations[i], Config.zoneRadius, {
            name = 'hub_bank_' .. i,
            debugPoly = false,
            useZ = true,
        })
        zones[#zones + 1] = zone
    end

    local combo = ComboZone:Create(zones, {
        name = 'hub_bank_combo',
        debugPoly = false,
    })

    combo:onPlayerInOut(function(isPointInside)
        isPlayerInsideBankZone = isPointInside
        if isPlayerInsideBankZone then
            local prompt = Text.prompt or 'Press [E] to access Hub Bank'
            exports['qb-core']:DrawText(prompt)
            CreateThread(function()
                while isPlayerInsideBankZone do
                    Wait(0)
                    if IsControlJustPressed(0, 38) then
                        OpenBank()
                    end
                end
            end)
        else
            exports['qb-core']:HideText()
        end
    end)
end)
