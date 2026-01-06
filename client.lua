local QBCore = exports['qb-core']:GetCoreObject()
local zones = {}
local isPlayerInsideBankZone = false
local isUiOpen = false
local isAtmPromptVisible = false
local atmPromptType = nil
local hasBankCard = false
local Text = Config.text or {}

local function RefreshBankCardStatus()
    local playerData = QBCore.Functions.GetPlayerData()
    local items = playerData and playerData.items or {}
    hasBankCard = false
    if items then
        for _, item in pairs(items) do
            if item and item.name == 'bank_card' then
                hasBankCard = true
                break
            end
        end
    end
end

local function OpenBank(mode)
    if isUiOpen then return end
    QBCore.Functions.TriggerCallback('hub-banking:server:getData', function(data)
        if not data then return end
        isUiOpen = true
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'open',
            data = data,
            locale = Text.ui or {},
            mode = mode or 'bank'
        })
    end)
end

local function IsNearATM()
    local playerCoords = GetEntityCoords(PlayerPedId())
    for i = 1, #Config.atmModels do
        local hash = joaat(Config.atmModels[i])
        local atm = GetClosestObjectOfType(playerCoords.x, playerCoords.y, playerCoords.z, Config.atmDistance, hash, false, false, false)
        if atm and atm ~= 0 then
            return true
        end
    end
    return false
end

local function TryOpenATM()
    QBCore.Functions.TriggerCallback('hub-banking:server:canUseAtm', function(result)
        if not result or not result.success then
            if result and result.message then
                QBCore.Functions.Notify(result.message, 'error')
            end
            return
        end
        OpenBank('atm')
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

RegisterNUICallback('orderCard', function(data, cb)
    QBCore.Functions.TriggerCallback('hub-banking:server:orderCard', function(result)
        cb(result)
        if result and result.success then
            RefreshBankCardStatus()
        end
    end, data)
end)

RegisterNUICallback('verifyPin', function(data, cb)
    QBCore.Functions.TriggerCallback('hub-banking:server:verifyPin', function(result)
        cb(result)
    end, data)
end)

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    RefreshBankCardStatus()
end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function()
    RefreshBankCardStatus()
end)

CreateThread(function()
    Wait(1000)
    RefreshBankCardStatus()
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
                        OpenBank('bank')
                    end
                end
            end)
        else
            exports['qb-core']:HideText()
        end
    end)
end)

CreateThread(function()
    while true do
        if isPlayerInsideBankZone then
            if isAtmPromptVisible then
                exports['qb-core']:HideText()
                isAtmPromptVisible = false
                atmPromptType = nil
            end
            Wait(500)
        else
            local nearAtm = IsNearATM()
            local wantPrompt = nearAtm
            local promptType = hasBankCard and 'card' or 'nocard'
            local promptText = hasBankCard and (Text.atmPrompt or 'Press [E] to use ATM')
                or (Text.atmNoCardPrompt or 'Bank card required')

            if wantPrompt and (not isAtmPromptVisible or atmPromptType ~= promptType) then
                exports['qb-core']:DrawText(promptText)
                isAtmPromptVisible = true
                atmPromptType = promptType
            elseif not wantPrompt and isAtmPromptVisible then
                exports['qb-core']:HideText()
                isAtmPromptVisible = false
                atmPromptType = nil
            end

            if nearAtm and hasBankCard and IsControlJustPressed(0, 38) then
                TryOpenATM()
            end

            Wait(nearAtm and 0 or 500)
        end
    end
end)
