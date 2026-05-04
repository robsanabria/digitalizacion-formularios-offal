# Azure CLI - comandos recomendados (ajustar nombres)

## 1) Login
```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID_OR_NAME>"
```

## 2) Crear Storage Account (si no existe)
Reemplazar `<storageName>` por un nombre globalmente único (solo minúsculas, números).
```bash
az group create -n regsis-rg -l eastus
az storage account create -n <storageName> -g regsis-rg -l eastus --sku Standard_LRS
```

## 3) Crear container para attachments
```bash
az storage container create --account-name <storageName> --name regsis-attachments --auth-mode login
```

## 4) Conceder permiso para escribir blobs (Storage Blob Data Contributor)
Reemplazar `user@company.com` por el UPN o usar objectId.
```bash
STORAGE_ID=$(az storage account show -n <storageName> -g regsis-rg --query id -o tsv)
az role assignment create --assignee user@company.com --role "Storage Blob Data Contributor" --scope $STORAGE_ID
```

## 5) Subir archivo de ejemplo (opcional)
```bash
az storage blob upload --account-name <storageName> -c regsis-attachments --file ./ejemplo.pdf --name requests/<RequestId>/ejemplo.pdf
```

## 6) Azure SQL - conceder acceso a usuario (pasos resumidos)
- Si se usa autenticación AAD: crear/añadir usuario AAD y luego crear usuario dentro de la base de datos.

Ejemplo T-SQL (en el servidor SQL):
```sql
CREATE USER [user@company.com] FROM EXTERNAL PROVIDER;
EXEC sp_addrolemember 'db_datareader', 'user@company.com';
EXEC sp_addrolemember 'db_datawriter', 'user@company.com';
```

## Notas
- Sustituir nombres de recursos por los que usen en la suscripción.
- Para automatizar permisos desde CI se recomienda crear un Service Principal y usar `az role assignment` con su `clientId`.

## Guía rápida para tu App Service `controlEtiquetas`

Requisitos: tienes un App Service `controlEtiquetas` en el grupo `ControlEtiquetas` (según portal). Estos pasos habilitan la identidad administrada y configuran Storage + Document Intelligence.

1) Login y seleccionar suscripción
```bash
az login
az account set --subscription "d35cfe79-0a1f-4040-92a0-3e3b26aabf57"
```

2) Habilitar System-assigned Managed Identity en el App Service
```bash
az webapp identity assign --name controlEtiquetas --resource-group ControlEtiquetas
# Verificar principalId
az webapp show --name controlEtiquetas --resource-group ControlEtiquetas --query identity.principalId -o tsv
```

3) Crear Storage Account (si no existe) y container `regsis-attachments`
```bash
# Elegir un nombre único para storage account, ejemplo: regsisattachments{suffix}
STORAGE_NAME=<youruniquestorage>
az storage account create --name $STORAGE_NAME --resource-group ControlEtiquetas --location eastus --sku Standard_LRS

# Crear container (usamos auth-mode login para usar la identidad asignada cuando sea necesario)
az storage container create --account-name $STORAGE_NAME --name regsis-attachments --auth-mode login
```

4) Asignar rol Storage Blob Data Contributor al App Service identity
```bash
# Obtener scope del storage account
STORAGE_ID=$(az storage account show -n $STORAGE_NAME -g ControlEtiquetas --query id -o tsv)

# Obtener principalId del WebApp (desde paso 2)
PRINCIPAL_ID=$(az webapp show -n controlEtiquetas -g ControlEtiquetas --query identity.principalId -o tsv)

az role assignment create --assignee-object-id $PRINCIPAL_ID --assignee-principal-type ServicePrincipal --role "Storage Blob Data Contributor" --scope $STORAGE_ID
```

5) Crear recurso Azure Document Intelligence (Form Recognizer) si no existe
```bash
# Nombre ejemplo: regsis-docint
az cognitiveservices account create -n regsis-docint -g ControlEtiquetas -l eastus --kind FormRecognizer --sku S0 --yes

# Obtener endpoint y key (opcional, o usar AAD)
az cognitiveservices account keys list -n regsis-docint -g ControlEtiquetas
az cognitiveservices account show -n regsis-docint -g ControlEtiquetas --query endpoint -o tsv
```

6) Configurar App Settings en la WebApp (opciones: usar keys o usar Managed Identity + AAD)
Ejemplo con variables (si usas keys):
```bash
az webapp config appsettings set -n controlEtiquetas -g ControlEtiquetas --settings \
	STORAGE_ACCOUNT_NAME=$STORAGE_NAME \
	STORAGE_CONTAINER=regsis-attachments \
	DOCINT_ENDPOINT=<DOCINT_ENDPOINT> \
	DOCINT_KEY=<DOCINT_KEY>
```

Si prefieres AAD + Managed Identity, en la app usa `DefaultAzureCredential` (SDK) y no pongas keys en appsettings; ya asignaste permisos al storage.

7) Subir archivo de prueba (desde tu máquina local autenticada con `az login`)
```bash
az storage blob upload --account-name $STORAGE_NAME -c regsis-attachments --file ./ejemplo.pdf --name requests/TEST123/ejemplo.pdf --auth-mode login
```

8) Notas finales
- Reemplaza nombres y regiones según convenga.
- Si prefieres que yo actualice el repo con estos comandos adaptados (con placeholders y ejemplo concreto), dime y lo pusheo.

