param(
    [ValidateSet('Summary', 'Detailed', 'Csv')]
    [string]$Mode = 'Summary'
)

$HoursPerMonth = 730.0
$GbToGib = 1000000000.0 / 1073741824.0
$StorageHeadroomRatio = 0.30
$UsableStorageRatio = 1.0 - $StorageHeadroomRatio

$Scenarios = @(
    [pscustomobject]@{ Name = 'Bajo'; DbInitialGb = 5.0; DbGrowthGb = 1.0; Requests = 100000; Submissions = 100; Jobs = 100; LogsGb = 2.0; ObjectGrowthGb = 0.4; GcpDbHourly = 0.101375; AwsDbHourly = 0.034; AzureDbHourly = 0.035 },
    [pscustomobject]@{ Name = 'Esperado'; DbInitialGb = 10.0; DbGrowthGb = 3.0; Requests = 500000; Submissions = 500; Jobs = 500; LogsGb = 10.0; ObjectGrowthGb = 2.0; GcpDbHourly = 0.101375; AwsDbHourly = 0.069; AzureDbHourly = 0.14 },
    [pscustomobject]@{ Name = 'Alto'; DbInitialGb = 25.0; DbGrowthGb = 10.0; Requests = 2000000; Submissions = 2500; Jobs = 2500; LogsGb = 50.0; ObjectGrowthGb = 10.0; GcpDbHourly = 0.20275; AwsDbHourly = 0.137; AzureDbHourly = 0.14 }
)

# Single source for staging values used by both list-price and allowance views.
$StagingConfig = @{
    GCP = [pscustomobject]@{
        TotalListPrice = 14.94; Requests = 20000; RequestDurationSeconds = 0.4
        RuntimeCpu = 1.0; RuntimeMemoryGiB = 0.5; Jobs = 20; JobDurationSeconds = 60
        JobCpu = 1.0; JobMemoryGiB = 0.5; LogsGb = 1.0; LogsUnitPrice = 0.50
    }
    AWS = [pscustomobject]@{
        TotalListPrice = 22.94; Requests = 0; RequestDurationSeconds = 0.0
        RuntimeCpu = 0.0; RuntimeMemoryGiB = 0.0; Jobs = 0; JobDurationSeconds = 0
        JobCpu = 0.0; JobMemoryGiB = 0.0; LogsGb = 1.0; LogsUnitPrice = 0.90
    }
    Azure = [pscustomobject]@{
        TotalListPrice = 17.29; Requests = 20000; RequestDurationSeconds = 0.4
        RuntimeCpu = 0.25; RuntimeMemoryGiB = 0.5; Jobs = 20; JobDurationSeconds = 60
        JobCpu = 0.25; JobMemoryGiB = 0.5; LogsGb = 1.0; LogsUnitPrice = 4.60
    }
}

function Get-StagingUsage([string]$Provider) {
    if (-not $StagingConfig.ContainsKey($Provider)) { throw "Unknown staging provider: $Provider" }
    return $StagingConfig[$Provider]
}

function Assert-Near([string]$Label, [double]$Actual, [double]$Expected, [double]$Tolerance = 0.01) {
    if ([math]::Abs($Actual - $Expected) -gt $Tolerance) {
        throw "$Label drifted: actual=$Actual expected=$Expected tolerance=$Tolerance"
    }
}

function Get-AzureStorageAllocation([double]$RequiredGiB) {
    foreach ($size in @(32, 64, 128, 256, 512, 1024, 2048, 4096)) {
        if ($size -ge $RequiredGiB) { return [double]$size }
    }
    throw "Required storage exceeds the frozen v1 model: $RequiredGiB GiB"
}

function Get-MonthCost($Scenario, [string]$Provider, [int]$Month) {
    $logicalDbGb = $Scenario.DbInitialGb + (($Month - 1) * $Scenario.DbGrowthGb)
    $logicalDbGiB = $logicalDbGb * $GbToGib
    $requiredDbGiB = [math]::Ceiling($logicalDbGiB / $UsableStorageRatio)
    $objectCount = $Scenario.Submissions * 2

    if ($Provider -eq 'GCP') {
        $runtime = ($Scenario.Requests * 0.4 * 1.0 * 0.000024) + ($Scenario.Requests * 0.4 * 0.5 * 0.0000025) + (($Scenario.Requests / 1000000.0) * 0.40)
        $jobs = ($Scenario.Jobs * 60 * 1.0 * 0.000024) + ($Scenario.Jobs * 60 * 0.5 * 0.0000025)
        $dbCompute = $Scenario.GcpDbHourly * $HoursPerMonth
        $dbAllocatedGiB = [math]::Max(10.0, $requiredDbGiB)
        $dbStorage = $dbAllocatedGiB * 0.255
        $dbBackup = $logicalDbGiB * 0.12
        $objectStorage = ($Scenario.ObjectGrowthGb * $Month * $GbToGib) * 0.035
        $objectOperations = ($objectCount * 0.000005) + ($objectCount * 0.0000004)
        $networking = 0.0
        $registryAndSecrets = 0.28
        $observability = $Scenario.LogsGb * 0.50
        $staging = (Get-StagingUsage 'GCP').TotalListPrice
    }
    elseif ($Provider -eq 'AWS') {
        $taskHourly = (0.25 * 0.0696) + (0.5 * 0.0076)
        $runtime = $taskHourly * $HoursPerMonth
        $jobs = ($Scenario.Jobs / 60.0) * $taskHourly
        $dbCompute = $Scenario.AwsDbHourly * $HoursPerMonth
        $dbAllocatedGiB = [math]::Max(20.0, $requiredDbGiB)
        $dbStorage = $dbAllocatedGiB * 0.219
        $dbBackup = 0.0
        $objectStorage = $Scenario.ObjectGrowthGb * $Month * 0.0405
        $objectOperations = ($objectCount * 0.000007) + ($objectCount * 0.00000056)
        $networking = 24.82 + 0.803 + 7.30 + 3.65
        $registryAndSecrets = 1.30
        $observability = $Scenario.LogsGb * 0.90
        $staging = (Get-StagingUsage 'AWS').TotalListPrice
    }
    elseif ($Provider -eq 'Azure') {
        $runtime = ($Scenario.Requests * 0.4 * 0.25 * 0.000024) + ($Scenario.Requests * 0.4 * 0.5 * 0.000003) + (($Scenario.Requests / 1000000.0) * 0.40)
        $jobs = ($Scenario.Jobs * 60 * 0.25 * 0.000024) + ($Scenario.Jobs * 60 * 0.5 * 0.000003)
        $dbCompute = $Scenario.AzureDbHourly * $HoursPerMonth
        $dbAllocatedGiB = Get-AzureStorageAllocation ([math]::Max(32.0, $requiredDbGiB))
        $dbStorage = $dbAllocatedGiB * 0.2185
        $dbBackup = 0.0
        $objectStorage = $Scenario.ObjectGrowthGb * $Month * 0.0326
        $objectOperations = ($objectCount * 0.000007) + ($objectCount * 0.00000056)
        $networking = 0.0
        $registryAndSecrets = 5.08
        $observability = $Scenario.LogsGb * 4.60
        $staging = (Get-StagingUsage 'Azure').TotalListPrice
    }
    else {
        throw "Unknown provider: $Provider"
    }

    $total = $runtime + $jobs + $dbCompute + $dbStorage + $dbBackup + $objectStorage + $objectOperations + $networking + $registryAndSecrets + $observability + $staging
    [pscustomobject]@{
        Scenario = $Scenario.Name
        Provider = $Provider
        Month = $Month
        LogicalDbGB = [math]::Round($logicalDbGb, 3)
        LogicalDbGiB = [math]::Round($logicalDbGiB, 3)
        RequiredDbGiB = $requiredDbGiB
        AllocatedDbGiB = $dbAllocatedGiB
        Runtime = [math]::Round($runtime, 4)
        Jobs = [math]::Round($jobs, 4)
        DbCompute = [math]::Round($dbCompute, 4)
        DbStorage = [math]::Round($dbStorage, 4)
        DbBackup = [math]::Round($dbBackup, 4)
        ObjectStorage = [math]::Round($objectStorage, 4)
        ObjectOperations = [math]::Round($objectOperations, 4)
        Networking = [math]::Round($networking, 4)
        RegistryAndSecrets = [math]::Round($registryAndSecrets, 4)
        Observability = [math]::Round($observability, 4)
        Staging = [math]::Round($staging, 4)
        Total = [math]::Round($total, 4)
    }
}

$Details = foreach ($scenario in $Scenarios) {
    foreach ($provider in @('GCP', 'AWS', 'Azure')) {
        foreach ($month in 1..12) {
            Get-MonthCost $scenario $provider $month
        }
    }
}

$Summary = foreach ($scenario in $Scenarios) {
    foreach ($provider in @('GCP', 'AWS', 'Azure')) {
        $rows = @($Details | Where-Object { $_.Scenario -eq $scenario.Name -and $_.Provider -eq $provider })
        $maxRow = $rows | Sort-Object Total -Descending | Select-Object -First 1
        [pscustomobject]@{
            Scenario = $scenario.Name
            Provider = $provider
            Month1USD = [math]::Round(($rows | Where-Object Month -eq 1).Total, 2)
            Month12USD = [math]::Round(($rows | Where-Object Month -eq 12).Total, 2)
            MaxMonthlyYear1USD = [math]::Round($maxRow.Total, 2)
            MonthOfMaxCost = $maxRow.Month
            Year1USD = [math]::Round(($rows | Measure-Object Total -Sum).Sum, 2)
            DbAllocationMonth1GiB = ($rows | Where-Object Month -eq 1).AllocatedDbGiB
            DbAllocationMonth12GiB = ($rows | Where-Object Month -eq 12).AllocatedDbGiB
        }
    }
}

$Expected = $Scenarios | Where-Object Name -eq 'Esperado'

$AzureConnectionSensitivity = foreach ($mapsHeadroom in @(5, 10, 20)) {
    $applicationConnections = 4 * 4
    $demand = $applicationConnections + $mapsHeadroom
    $b1Capacity = 35
    $b2Capacity = 414
    $b1Remaining = $b1Capacity - $demand
    $b2Remaining = $b2Capacity - $demand
    [pscustomobject]@{
        MaxInstances = 4
        PoolSize = 4
        ApplicationConnections = $applicationConnections
        MapsOperationalHeadroom = $mapsHeadroom
        TotalUserConnectionDemand = $demand
        AzureB1msUserCapacity = $b1Capacity
        B1msFitsTechnicalCapacity = ($demand -le $b1Capacity)
        B1msRemainingHeadroom = $b1Remaining
        B1msResult = if ($demand -lt $b1Capacity) { "Dentro del limite; conserva $b1Remaining de headroom" } elseif ($demand -eq $b1Capacity) { 'Dentro del limite tecnico, sin headroom' } else { 'Excede la capacidad tecnica publicada' }
        AzureB2sUserCapacity = $b2Capacity
        B2sFitsTechnicalCapacity = ($demand -le $b2Capacity)
        B2sRemainingHeadroom = $b2Remaining
        B2sResult = if ($demand -lt $b2Capacity) { "Dentro del limite; conserva $b2Remaining de headroom" } elseif ($demand -eq $b2Capacity) { 'Dentro del limite tecnico, sin headroom' } else { 'Excede la capacidad tecnica publicada' }
    }
}

$AzureTierSensitivity = foreach ($month in @(1, 12)) {
    $b2s = Get-MonthCost $Expected 'Azure' $month
    $b1ms = $b2s.Total - ((0.14 - 0.035) * $HoursPerMonth)
    [pscustomobject]@{
        Month = $month
        B1msProvisionalUSD = [math]::Round($b1ms, 2)
        B2sConservativeUSD = [math]::Round($b2s.Total, 2)
        DifferenceUSD = [math]::Round($b2s.Total - $b1ms, 2)
    }
}

# Sensitivity only: assumes the permanent published allowances are entirely
# available to MAPS. Production and the usage embedded in the frozen staging
# total share the allowance; promotional credits are deliberately excluded.
$AllowanceSensitivity = foreach ($provider in @('GCP', 'AWS', 'Azure')) {
    foreach ($month in @(1, 12)) {
        $base = Get-MonthCost $Expected $provider $month
        $stagingUsage = Get-StagingUsage $provider

        if ($provider -eq 'GCP') {
            $stagingCpuSeconds = ($stagingUsage.Requests * $stagingUsage.RequestDurationSeconds * $stagingUsage.RuntimeCpu) + ($stagingUsage.Jobs * $stagingUsage.JobDurationSeconds * $stagingUsage.JobCpu)
            $stagingMemoryGiBSeconds = ($stagingUsage.Requests * $stagingUsage.RequestDurationSeconds * $stagingUsage.RuntimeMemoryGiB) + ($stagingUsage.Jobs * $stagingUsage.JobDurationSeconds * $stagingUsage.JobMemoryGiB)
            $cpuSeconds = ($Expected.Requests * 0.4) + ($Expected.Jobs * 60) + $stagingCpuSeconds
            $memoryGiBSeconds = ($Expected.Requests * 0.4 * 0.5) + ($Expected.Jobs * 60 * 0.5) + $stagingMemoryGiBSeconds
            $requests = $Expected.Requests + $stagingUsage.Requests
            $stagingRuntime = ($stagingCpuSeconds * 0.000024) + ($stagingMemoryGiBSeconds * 0.0000025) + (($stagingUsage.Requests / 1000000.0) * 0.40)
            $grossRuntime = $base.Runtime + $base.Jobs + $stagingRuntime
            $netRuntime = ([math]::Max(0.0, $cpuSeconds - 180000) * 0.000024) +
                ([math]::Max(0.0, $memoryGiBSeconds - 360000) * 0.0000025) +
                (([math]::Max(0.0, $requests - 2000000) / 1000000.0) * 0.40)
            $grossLogs = $base.Observability + ($stagingUsage.LogsGb * $stagingUsage.LogsUnitPrice)
            $netLogs = [math]::Max(0.0, ($Expected.LogsGb + $stagingUsage.LogsGb) - 50.0) * 0.50
        }
        elseif ($provider -eq 'AWS') {
            # Fargate has no permanent runtime allowance in this topology.
            $grossRuntime = $base.Runtime + $base.Jobs
            $netRuntime = $grossRuntime
            $grossLogs = $base.Observability + ($stagingUsage.LogsGb * $stagingUsage.LogsUnitPrice)
            $netLogs = [math]::Max(0.0, ($Expected.LogsGb + $stagingUsage.LogsGb) - 5.0) * 0.90
        }
        else {
            $stagingCpuSeconds = ($stagingUsage.Requests * $stagingUsage.RequestDurationSeconds * $stagingUsage.RuntimeCpu) + ($stagingUsage.Jobs * $stagingUsage.JobDurationSeconds * $stagingUsage.JobCpu)
            $stagingMemoryGiBSeconds = ($stagingUsage.Requests * $stagingUsage.RequestDurationSeconds * $stagingUsage.RuntimeMemoryGiB) + ($stagingUsage.Jobs * $stagingUsage.JobDurationSeconds * $stagingUsage.JobMemoryGiB)
            $cpuSeconds = ($Expected.Requests * 0.4 * 0.25) + ($Expected.Jobs * 60 * 0.25) + $stagingCpuSeconds
            $memoryGiBSeconds = ($Expected.Requests * 0.4 * 0.5) + ($Expected.Jobs * 60 * 0.5) + $stagingMemoryGiBSeconds
            $requests = $Expected.Requests + $stagingUsage.Requests
            $stagingRuntime = ($stagingCpuSeconds * 0.000024) + ($stagingMemoryGiBSeconds * 0.000003) + (($stagingUsage.Requests / 1000000.0) * 0.40)
            $grossRuntime = $base.Runtime + $base.Jobs + $stagingRuntime
            $netRuntime = ([math]::Max(0.0, $cpuSeconds - 180000) * 0.000024) +
                ([math]::Max(0.0, $memoryGiBSeconds - 360000) * 0.000003) +
                (([math]::Max(0.0, $requests - 2000000) / 1000000.0) * 0.40)
            $grossLogs = $base.Observability + ($stagingUsage.LogsGb * $stagingUsage.LogsUnitPrice)
            $netLogs = [math]::Max(0.0, ($Expected.LogsGb + $stagingUsage.LogsGb) - 5.0) * 4.60
        }

        $discount = ($grossRuntime - $netRuntime) + ($grossLogs - $netLogs)
        [pscustomobject]@{
            Provider = $provider
            Month = $month
            ListPriceUSD = [math]::Round($base.Total, 2)
            NetOfAllowanceUSD = [math]::Round($base.Total - $discount, 2)
            DifferenceUSD = [math]::Round($discount, 2)
        }
    }
}

# Fail fast if values copied into EVIDENCE drift from the executable model.
$PublishedExpected = @{
    GCP = @{ Month1 = 104.99; Month12 = 120.61; NetMonth1 = 94.66; NetMonth12 = 110.29 }
    AWS = @{ Month1 = 140.30; Month12 = 149.52; NetMonth1 = 135.80; NetMonth12 = 145.02 }
    Azure = @{ Month1 = 179.56; Month12 = 187.27; NetMonth1 = 154.56; NetMonth12 = 162.27 }
}

foreach ($provider in @('GCP', 'AWS', 'Azure')) {
    $summaryRow = $Summary | Where-Object { $_.Scenario -eq 'Esperado' -and $_.Provider -eq $provider }
    $allowanceMonth1 = $AllowanceSensitivity | Where-Object { $_.Provider -eq $provider -and $_.Month -eq 1 }
    $allowanceMonth12 = $AllowanceSensitivity | Where-Object { $_.Provider -eq $provider -and $_.Month -eq 12 }
    Assert-Near "$provider Expected Month 1 list-price" $summaryRow.Month1USD $PublishedExpected[$provider].Month1
    Assert-Near "$provider Expected Month 12 list-price" $summaryRow.Month12USD $PublishedExpected[$provider].Month12
    Assert-Near "$provider Expected max monthly Year 1" $summaryRow.MaxMonthlyYear1USD $PublishedExpected[$provider].Month12
    if ($summaryRow.MonthOfMaxCost -ne 12) { throw "$provider Expected month of max cost drifted: $($summaryRow.MonthOfMaxCost)" }
    Assert-Near "$provider Expected Month 1 net-of-allowance" $allowanceMonth1.NetOfAllowanceUSD $PublishedExpected[$provider].NetMonth1
    Assert-Near "$provider Expected Month 12 net-of-allowance" $allowanceMonth12.NetOfAllowanceUSD $PublishedExpected[$provider].NetMonth12
}

$Ha = foreach ($provider in @('GCP', 'AWS', 'Azure')) {
    $monthTotals = foreach ($month in 1..12) {
        $base = Get-MonthCost $Expected $provider $month
        if ($provider -eq 'GCP') {
            $haTotal = $base.Total + $base.DbCompute + $base.DbStorage
        }
        elseif ($provider -eq 'AWS') {
            $secondTaskAndPublicIp = (((0.25 * 0.0696) + (0.5 * 0.0076)) * $HoursPerMonth) + (0.005 * $HoursPerMonth)
            $haTotal = $base.Total - $base.DbCompute - $base.DbStorage + (0.137 * $HoursPerMonth) + ($base.AllocatedDbGiB * 0.438) + $secondTaskAndPublicIp
        }
        else {
            $activeCpuSeconds = ($Expected.Requests * 0.4 * 0.25) + ($Expected.Jobs * 60 * 0.25)
            $twoIdleReplicas = 2 * ((0.25 * 0.000003) + (0.5 * 0.000003)) * $HoursPerMonth * 3600
            $haRuntime = $twoIdleReplicas + ($activeCpuSeconds * (0.000024 - 0.000003)) + (($Expected.Requests / 1000000.0) * 0.40)
            $haDbCompute = 2 * 2 * 0.12 * $HoursPerMonth
            $haTotal = $base.Total - $base.Runtime - $base.Jobs - $base.DbCompute - $base.DbStorage + $haRuntime + $haDbCompute + (2 * $base.DbStorage)
        }
        [math]::Round($haTotal, 4)
    }
    [pscustomobject]@{
        Provider = $provider
        Month1USD = [math]::Round($monthTotals[0], 2)
        Month12USD = [math]::Round($monthTotals[11], 2)
        Year1USD = [math]::Round(($monthTotals | Measure-Object -Sum).Sum, 2)
    }
}

if ($Mode -eq 'Csv') {
    $Details | ConvertTo-Csv -NoTypeInformation
}
elseif ($Mode -eq 'Detailed') {
    $Details | Format-Table -AutoSize
    'Azure Expected connection-budget sensitivity'
    $AzureConnectionSensitivity | Format-Table -AutoSize
    'Azure Expected B1ms provisional vs B2s conservative'
    $AzureTierSensitivity | Format-Table -AutoSize
    'Expected net-of-allowance sensitivity'
    $AllowanceSensitivity | Format-Table -AutoSize
    'Expected + zone-failure tolerance sensitivity'
    $Ha | Format-Table -AutoSize
}
else {
    $Summary | Format-Table -AutoSize
    'Azure Expected connection-budget sensitivity'
    $AzureConnectionSensitivity | Format-Table -AutoSize
    'Azure Expected B1ms provisional vs B2s conservative'
    $AzureTierSensitivity | Format-Table -AutoSize
    'Expected net-of-allowance sensitivity'
    $AllowanceSensitivity | Format-Table -AutoSize
    'Expected + zone-failure tolerance sensitivity'
    $Ha | Format-Table -AutoSize
}
