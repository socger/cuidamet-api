* La petición #10 ("QUITAR ROL DE USUARIO (ADMIN)") si la ejecuto varias veces,
        siempre responde lo mismo:

        HTTP/1.1 200 OK
        X-Powered-By: Express
        Content-Type: application/json; charset=utf-8
        Content-Length: 227
        ETag: W/"e3-qM9CkQwY2SKHlhGzWFDrwihSqts"
        Date: Sat, 30 Aug 2025 20:23:15 GMT
        Connection: close

        {
        "message": "Rol removido exitosamente",
        "data": {
            "id": 2,
            "username": "testuser",
            "email": "test@socgerfleet.com",
            "firstName": "Nombre Actualizado",
            "lastName": "Prueba",
            "isActive": true,
            "createdAt": "2025-08-29T13:37:28.673Z",
            "roles": []
        }
        }

        Creo que no comprueba si existe el rol del usuario antes de pasar a borrarlo.

* Hay que comprobar si tras los cambios hechos en el repositorio api plantilla, funcionan todos los endPoints en swagger.

* lo siguiente a trabajar ..
