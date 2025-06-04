--[[
    Module de décodage TM (Transport Management)
    Décode les codes TM générés par le frontend et régénère les horaires théoriques
    
    Usage:
    local TMDecoder = require(script.TMDecoder)
    local schedules = TMDecoder.decode("1730MOCH...")
--]]

local TMDecoder = {}

-- Alphabet utilisé pour l'encodage/décodage Base36
local ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

-- Types de données
type RegulationPoint = {
	name: string,
	time: number
}

type HautLePied = {
	toTerminus: number,
	fromTerminus: number
}

type TMData = {
	version: string,
	lineNumber: string,
	terminus1: string,
	terminus2: string,
	depotCode: string,
	regulationPoints1to2: {RegulationPoint},
	regulationPoints2to1: {RegulationPoint},
	totalTime1to2: number,
	totalTime2to1: number,
	lastRegToTerminus1to2: number,
	lastRegToTerminus2to1: number,
	hautLePied1: HautLePied,
	hautLePied2: HautLePied,
	firstDeparture: string,
	lastReturn: string,
	frequency: number,
	minPauseTime: number
}

type SchedulePoint = {
	point: string,
	time: number,
	formatted: string,
	terminus: string?
}

type VehicleSchedule = {
	vehicleNumber: string,
	schedulePoints: {SchedulePoint}
}

-- Décode un nombre depuis Base36
local function decodeNumber(str: string): number
	local result = 0
	local base = 1

	for i = #str, 1, -1 do
		local char = string.sub(str, i, i)
		local index = string.find(ALPHABET, char)
		if index then
			result = result + (index - 1) * base
			base = base * 36
		end
	end

	return result
end

-- Décode un texte (enlève les padding '0')
local function decodeText(str: string): string
	return string.gsub(str, "0+$", "")
end

-- Calcule le checksum d'une chaîne
local function calculateChecksum(data: string): string
	local sum = 0
	for i = 1, #data do
		sum = sum + string.byte(data, i) * i
	end
	local checksumValue = sum % 1296 -- 36^2
	return string.format("%02X", checksumValue):sub(-2) -- Prendre les 2 derniers caractères
end

-- Encode un nombre en base36 avec padding
local function encodeNumber(num: number, minLength: number): string
	local result = ""
	local value = num

	if value == 0 then
		result = "0"
	else
		while value > 0 do
			local remainder = value % 36
			result = string.sub(ALPHABET, remainder + 1, remainder + 1) .. result
			value = math.floor(value / 36)
		end
	end

	-- Padding
	while #result < minLength do
		result = "0" .. result
	end

	return result
end

-- Valide le checksum du TM
local function validateTM(tm: string): boolean
	if #tm < 10 then
		return false
	end

	local checksum = string.sub(tm, -2)
	local data = string.sub(tm, 1, -3)
	local calculatedChecksum = encodeNumber(
		tonumber(calculateChecksum(data):sub(-2), 16) or 0, 
		2
	)

	return checksum == calculatedChecksum
end

-- Décode un temps en minutes vers format HH:MM
local function decodeTime(minutes: number): string
	local hours = math.floor(minutes / 60)
	local mins = minutes % 60
	return string.format("%02d:%02d", hours, mins)
end

-- Parse le temps HH:MM en minutes
local function parseTime(timeStr: string): number
	local hour, minute = timeStr:match("(%d+):(%d+)")
	return (tonumber(hour) or 0) * 60 + (tonumber(minute) or 0)
end

-- Formate l'horaire pour l'affichage
local function formatTimeForSchedule(minutes: number, prevHour: number?): string
	local hours = math.floor(minutes / 60)
	local mins = minutes % 60

	if prevHour and hours ~= prevHour then
		return string.format("%d%02d", hours, mins)
	end
	return string.format("%02d", mins)
end

-- Décode les points de régulation
local function decodeRegulationPoints(tmData: string, startPos: number): ({RegulationPoint}, number)
	local pos = startPos
	local count = decodeNumber(string.sub(tmData, pos, pos))
	pos = pos + 1

	local points = {}
	for i = 1, count do
		local name = decodeText(string.sub(tmData, pos, pos + 2))
		pos = pos + 3
		local time = decodeNumber(string.sub(tmData, pos, pos + 1))
		pos = pos + 2

		table.insert(points, {
			name = name,
			time = time
		})
	end

	return points, pos
end

-- Décode complètement un TM
function TMDecoder.decode(tm: string): {VehicleSchedule}?
	-- Validation du checksum
	--[[if not validateTM(tm) then
		warn("TM invalide: checksum incorrect")
		return nil
	end]]

	local pos = 1

	-- Version
	local version = string.sub(tm, pos, pos)
	pos = pos + 1

	if version ~= "1" then
		warn("Version TM non supportée: " .. version)
		return nil
	end

	-- Ligne (2 chars)
	local lineNumber = decodeText(string.sub(tm, pos, pos + 1))
	pos = pos + 2

	-- Terminus (3 chars chacun)
	local terminus1 = decodeText(string.sub(tm, pos, pos + 2))
	pos = pos + 3
	local terminus2 = decodeText(string.sub(tm, pos, pos + 2))
	pos = pos + 3

	-- Dépôt (3 chars)
	local depotCode = decodeText(string.sub(tm, pos, pos + 2))
	pos = pos + 3

	-- Points de régulation
	local regulationPoints1to2, newPos = decodeRegulationPoints(tm, pos)
	pos = newPos
	local regulationPoints2to1, newPos2 = decodeRegulationPoints(tm, pos)
	pos = newPos2

	-- Temps et paramètres (2 chars chacun)
	local totalTime1to2 = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local totalTime2to1 = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local lastRegToTerminus1to2 = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local lastRegToTerminus2to1 = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2

	-- Haut-le-pied (2 chars chacun)
	local hautLePied1ToTerminus = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local hautLePied1FromTerminus = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local hautLePied2ToTerminus = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local hautLePied2FromTerminus = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2

	-- Paramètres de génération (3 chars pour les temps, 2 chars pour les autres)
	local firstDepartureMin = decodeNumber(string.sub(tm, pos, pos + 2))
	pos = pos + 3
	local lastReturnMin = decodeNumber(string.sub(tm, pos, pos + 2))
	pos = pos + 3
	local frequency = decodeNumber(string.sub(tm, pos, pos + 1))
	pos = pos + 2
	local minPauseTime = decodeNumber(string.sub(tm, pos, pos + 1))

	-- Reconstruction des données
	local tmData: TMData = {
		version = version,
		lineNumber = lineNumber,
		terminus1 = terminus1,
		terminus2 = terminus2,
		depotCode = depotCode,
		regulationPoints1to2 = regulationPoints1to2,
		regulationPoints2to1 = regulationPoints2to1,
		totalTime1to2 = totalTime1to2,
		totalTime2to1 = totalTime2to1,
		lastRegToTerminus1to2 = lastRegToTerminus1to2,
		lastRegToTerminus2to1 = lastRegToTerminus2to1,
		hautLePied1 = {
			toTerminus = hautLePied1ToTerminus,
			fromTerminus = hautLePied1FromTerminus
		},
		hautLePied2 = {
			toTerminus = hautLePied2ToTerminus,
			fromTerminus = hautLePied2FromTerminus
		},
		firstDeparture = decodeTime(firstDepartureMin),
		lastReturn = decodeTime(lastReturnMin),
		frequency = frequency,
		minPauseTime = minPauseTime
	}

	-- Génération des horaires
	return TMDecoder.generateSchedules(tmData)
end

-- Génère les horaires à partir des données décodées
function TMDecoder.generateSchedules(data: TMData): {VehicleSchedule}
	local firstDepMin = parseTime(data.firstDeparture)
	local lastRetMin = parseTime(data.lastReturn)

	-- Calcul des temps de trajet
	local travelTime1to2 = 0
	for _, point in ipairs(data.regulationPoints1to2) do
		travelTime1to2 = travelTime1to2 + point.time
	end
	travelTime1to2 = travelTime1to2 + data.lastRegToTerminus1to2

	local travelTime2to1 = 0
	for _, point in ipairs(data.regulationPoints2to1) do
		travelTime2to1 = travelTime2to1 + point.time
	end
	travelTime2to1 = travelTime2to1 + data.lastRegToTerminus2to1

	-- Calcul du cycle
	local totalTravelTime = travelTime1to2 + travelTime2to1
	local cycleTime = math.ceil(totalTravelTime / data.frequency) * data.frequency

	-- Calcul des battements
	local totalBattementTime = cycleTime - totalTravelTime
	local battement1to2 = math.floor(totalBattementTime / 2)
	local battement2to1 = totalBattementTime - battement1to2

	-- Vérification pause minimale
	if battement1to2 < data.minPauseTime or battement2to1 < data.minPauseTime then
		local minTotalBattement = data.minPauseTime * 2
		local minCycleTime = totalTravelTime + minTotalBattement
		cycleTime = math.ceil(minCycleTime / data.frequency) * data.frequency

		totalBattementTime = cycleTime - totalTravelTime
		battement1to2 = math.max(data.minPauseTime, math.floor(totalBattementTime / 2))
		battement2to1 = totalBattementTime - battement1to2

		if battement2to1 < data.minPauseTime then
			battement2to1 = data.minPauseTime
			battement1to2 = totalBattementTime - battement2to1
		end
	end

	local minVehicles = math.ceil(cycleTime / data.frequency)
	local schedules = {}

	-- Génération pour chaque véhicule
	for vehicleId = 1, minVehicles do
		local vehicleSchedule: VehicleSchedule = {
			vehicleNumber = string.format("V%03d", vehicleId),
			schedulePoints = {}
		}

		local currentTime = firstDepMin + ((vehicleId - 1) * data.frequency)
		local tripNumber = 1

		while currentTime + cycleTime <= lastRetMin do
			-- Haut-le-pied sortie (premier tour seulement)
			if tripNumber == 1 then
				local hautLePiedTime = data.hautLePied1.toTerminus
				local depotDepartureTime = currentTime - hautLePiedTime
				table.insert(vehicleSchedule.schedulePoints, {
					point = "DEPOT_OUT",
					time = depotDepartureTime,
					formatted = decodeTime(depotDepartureTime),
					terminus = data.depotCode
				})
			end

			-- === TRAJET ALLER ===
			local time = currentTime
			local prevHour = math.floor(time / 60)

			-- HD (Heure de Départ)
			table.insert(vehicleSchedule.schedulePoints, {
				point = "HD",
				time = time,
				formatted = string.format("%d%02d", math.floor(time / 60), time % 60),
				terminus = data.terminus1
			})

			-- Points de régulation aller
			for _, point in ipairs(data.regulationPoints1to2) do
				time = time + point.time
				local hour = math.floor(time / 60)
				table.insert(vehicleSchedule.schedulePoints, {
					point = point.name,
					time = time,
					formatted = formatTimeForSchedule(time, prevHour)
				})
				prevHour = hour
			end

			-- Arrivée aller
			time = time + data.lastRegToTerminus1to2
			local arrivalTime = time
			table.insert(vehicleSchedule.schedulePoints, {
				point = "ARR",
				time = arrivalTime,
				formatted = formatTimeForSchedule(arrivalTime, prevHour),
				terminus = data.terminus2
			})

			-- === TRAJET RETOUR ===
			time = arrivalTime + battement1to2
			prevHour = math.floor(time / 60)

			-- HD retour
			table.insert(vehicleSchedule.schedulePoints, {
				point = "HD",
				time = time,
				formatted = string.format("%d%02d", math.floor(time / 60), time % 60),
				terminus = data.terminus2
			})

			-- Points de régulation retour
			for _, point in ipairs(data.regulationPoints2to1) do
				time = time + point.time
				local hour = math.floor(time / 60)
				table.insert(vehicleSchedule.schedulePoints, {
					point = point.name,
					time = time,
					formatted = formatTimeForSchedule(time, prevHour)
				})
				prevHour = hour
			end

			-- Arrivée retour
			time = time + data.lastRegToTerminus2to1
			local returnArrivalTime = time
			table.insert(vehicleSchedule.schedulePoints, {
				point = "ARR",
				time = returnArrivalTime,
				formatted = formatTimeForSchedule(returnArrivalTime, prevHour),
				terminus = data.terminus1
			})

			-- Préparer le prochain tour
			currentTime = returnArrivalTime + battement2to1
			tripNumber = tripNumber + 1
		end

		-- Haut-le-pied retour (dernier tour)
		if #vehicleSchedule.schedulePoints > 0 then
			local lastSchedulePoint = vehicleSchedule.schedulePoints[#vehicleSchedule.schedulePoints]
			local hautLePiedReturnTime = data.hautLePied1.fromTerminus
			local depotArrivalTime = lastSchedulePoint.time + hautLePiedReturnTime
			table.insert(vehicleSchedule.schedulePoints, {
				point = "DEPOT_IN",
				time = depotArrivalTime,
				formatted = decodeTime(depotArrivalTime),
				terminus = data.depotCode
			})
		end

		if #vehicleSchedule.schedulePoints > 0 then
			table.insert(schedules, vehicleSchedule)
		end
	end

	return schedules
end

-- Fonction utilitaire pour afficher les horaires
function TMDecoder.printSchedules(schedules: {VehicleSchedule})
	for _, vehicle in ipairs(schedules) do
		print("=== " .. vehicle.vehicleNumber .. " ===")
		for _, point in ipairs(vehicle.schedulePoints) do
			local terminusStr = point.terminus and (" [" .. point.terminus .. "]") or ""
			print(string.format("%s: %s%s", point.point, point.formatted, terminusStr))
		end
		print()
	end
end

return TMDecoder