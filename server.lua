local QBCore = exports['qb-core']:GetCoreObject()

local function buildPlayerData(Player)
    local charinfo = Player.PlayerData.charinfo
    local fullName = (charinfo.firstname or 'Player') .. ' ' .. (charinfo.lastname or '')
    return {
        name = fullName,
        cash = Player.PlayerData.money.cash or 0,
        bank = Player.PlayerData.money.bank or 0,
        citizenid = Player.PlayerData.citizenid
    }
end

QBCore.Functions.CreateCallback('hub-banking:server:getData', function(source, cb)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb(nil) end
    cb(buildPlayerData(Player))
end)

QBCore.Functions.CreateCallback('hub-banking:server:deposit', function(source, cb, data)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({ success = false, message = 'Player not found' }) end

    local amount = tonumber(data.amount)
    if not amount or amount <= 0 then
        return cb({ success = false, message = 'Enter a valid amount' })
    end

    if Player.PlayerData.money.cash < amount then
        return cb({ success = false, message = 'Not enough cash' })
    end

    Player.Functions.RemoveMoney('cash', amount, 'hub-banking deposit')
    Player.Functions.AddMoney('bank', amount, 'hub-banking deposit')

    local updated = buildPlayerData(Player)
    cb({ success = true, message = 'Deposit complete', cash = updated.cash, bank = updated.bank })
end)

QBCore.Functions.CreateCallback('hub-banking:server:withdraw', function(source, cb, data)
    local Player = QBCore.Functions.GetPlayer(source)
    if not Player then return cb({ success = false, message = 'Player not found' }) end

    local amount = tonumber(data.amount)
    if not amount or amount <= 0 then
        return cb({ success = false, message = 'Enter a valid amount' })
    end

    if Player.PlayerData.money.bank < amount then
        return cb({ success = false, message = 'Not enough bank balance' })
    end

    Player.Functions.RemoveMoney('bank', amount, 'hub-banking withdrawal')
    Player.Functions.AddMoney('cash', amount, 'hub-banking withdrawal')

    local updated = buildPlayerData(Player)
    cb({ success = true, message = 'Withdrawal complete', cash = updated.cash, bank = updated.bank })
end)
