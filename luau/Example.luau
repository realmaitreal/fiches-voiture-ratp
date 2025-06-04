local TMDecoder = require(script.TMDecoder)

-- Décoder un TM
local schedules = TMDecoder.decode("173MO0CG0CHA4RPC09ET10CPN005GAA084GAA07PN00BET20ERPC080Y0W05040F0H0C0E0A00Y60K00SD")

if schedules then
	-- Traitement des horaires
	for _, vehicle in ipairs(schedules) do
		print("Véhicule:", vehicle.vehicleNumber)
		for _, point in ipairs(vehicle.schedulePoints) do
			print("  ", point.point, ":", point.formatted)
		end
	end
end