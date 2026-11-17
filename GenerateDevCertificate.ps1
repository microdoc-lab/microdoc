$oid = "1.3.6.1.4.1.311.84.1.1"

# Clean old certificates
foreach ($store in @("My", "Root")) {
    Get-ChildItem "Cert:\CurrentUser\$store" |
        Where-Object {
            $_.Subject -eq "CN=localhost" -and
            ($_.Extensions | Where-Object { $_.Oid.Value -eq $oid })
        } |
        Remove-Item
}

# Generate certificate
$cert = New-SelfSignedCertificate `
    -Subject "CN=localhost" `
    -DnsName "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -Type SSLServerAuthentication `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -KeyExportPolicy Exportable `
    -HashAlgorithm SHA256 `
    -NotAfter (Get-Date).AddYears(2) `
    -FriendlyName "ASP.NET Core HTTPS development certificate" `
    -TextExtension @("$oid=06")

# Trust certificate
$cert |
    Export-Certificate -FilePath "$env:TEMP\aspnet-dev.cer" |
    Out-Null

Import-Certificate `
    -FilePath "$env:TEMP\aspnet-dev.cer" `
    -CertStoreLocation "Cert:\CurrentUser\Root" |
    Out-Null

Remove-Item "$env:TEMP\aspnet-dev.cer"