$(document).ready(comienzo);
var idUs;
var idPlatoPedido;

function comienzo() {
    var db = window.openDatabase("ObliTecBD", "1.0", "Base de datos ObliTec", 1024 * 1024 * 2);
    db.transaction(exec_sql, errorComienzo, successComienzo);
    function exec_sql(tx)
    {
        tx.executeSql('CREATE TABLE IF NOT EXISTS Usuarios (idUser integer primary key, email varchar(50) unique, nombre varchar(50), apellido varchar(50) not null, pass varchar(50) not null, uuid integer not null)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS FavoritosUsuario (idUser integer, idPlato integer, foreign key(idUser) references Usuarios(idUser), primary key(idUser, idPlato))');
    }
    $("#btnLogout").hide();
    $("#btnMisFav").hide();
    $("#panelPedido").hide();
    $("#btnToggle").hide();
    $('#pnlNavbar').enhanceWithin().panel();
    cargarMenu();
}

function errorComienzo()
{
    alert("Error cargando bd");
}

function successComienzo()
{

}

function goToRegistro()
{
    $.mobile.changePage('#registro');
}

function goToIndex()
{
    $.mobile.changePage('#inicio');
}

function goToLogin()
{
    $.mobile.changePage("#login");
}

function goToContacto()
{
    $.mobile.changePage("#contacto");
}

function goToMisFav()
{
    $.mobile.changePage("#favoritos");
    mostrarListaFavs();
}

function registro()
{
    var mail = txtEmail.value;
    var pass = txtPass.value;
    var pass2 = txtPass2.value;
    var nom = txtNombre.value;
    var ape = txtApellido.value;
    var uuidd = Math.random();
    $.ajax(
            {
                type: "post",
                datatype: "json",
                headers: {uuid: uuidd},
                url: "http://api.marcelocaiafa.com/user",
                data: JSON.stringify(
                        {
                            nombre: nom,
                            apellido: ape,
                            email: mail,
                            pwd: pass
                        }),
                success: function (res)
                {
                    resultado = res;
                    guardarUsuario(res.id, mail, nom, ape, pass, uuidd);
                    goToIndex();
                },
                error: function (e1, e2, e3)
                {
                    alert("Error");
                    console.log(JSON.parse(e1.responseText).description);
                }
            }
            )
}

function guardarUsuario(id, email, nombre, apellido, pass, uuid)
{
    var db = window.openDatabase("ObliTecBD", "1.0", "Base de datos ObliTec", 1024 * 1024 * 2);
    db.transaction(exec_sql, error, success);
    function exec_sql(tx)
    {
        tx.executeSql('INSERT INTO Usuarios values(?, ?, ?, ?, ?, ?)', [id, email, nombre, apellido, pass, uuid]);
    }
    function error()
    {
        alert("Error al guardar usuario");
    }
    function success(res)
    {
        alert("Bienvenid@, " + nombre + "!");
            $.ajax(
            {
                type: "POST",
                dataType: "JSON",
                url: "http://api.marcelocaiafa.com/signin",
                data: JSON.stringify(
                        {
                            email: email,
                            pwd: pass
                        }
                ),
                success: function (res)
                {
                    idUs = res.id;
                    $.mobile.changePage("#inicio");
                    toggleLoginLogout();
                }
    });
    }
}

function login()
{
    var emailUser = txtEmailLogin.value;
    var pass = txtPassLogin.value;
    $.ajax(
            {
                type: "POST",
                dataType: "JSON",
                url: "http://api.marcelocaiafa.com/signin",
                data: JSON.stringify(
                        {
                            email: emailUser,
                            pwd: pass
                        }
                ),
                success: function (res)
                {
                    console.log(res.id);
                    alert("Login exitoso.");
                    idUs = res.id;
                    $.mobile.changePage("#inicio");
                },
                error: function (e1, e2, e3)
                {
                    alert("Nombre de usuario o contraseña incorrectos.");
                    console.log(JSON.parse(e1.responseText).description);
                }
            })
    cargarMenu();
    toggleLoginLogout();
}

function toggleLoginLogout()
{
    $("#btnRegistro").toggle();
    $("#btnLogin").toggle();
    $("#btnMisFav").toggle();
    $("#btnLogout").toggle();
    $("#panelPedido").toggle();
    $("#btnToggle").toggle();
}

function logout()
{
    toggleLoginLogout();
    idUs = undefined;
}

function cargarMenu()
{
    $.ajax(
            {
                type: "GET",
                dataType: "JSON",
                url: "http://api.marcelocaiafa.com/menu",
                success: function (res)
                {
                    resultado = res;
                    $("#listaMenu").empty();
                    for (i = 0; i < resultado.length; i++)
                    {
                        var id = resultado[i].id;
                        var nombre = resultado[i].nombre;
                        var desc = resultado[i].descripcion;
                        var precio = resultado[i].precio;
                        $("#listaMenu").append("<li><a href='#' data-idItem='" + id + "' onclick='verItemMenu($(this))'><img src='http://images.marcelocaiafa.com/menu/" + id + ".jpg'><h2>" + nombre + "</h2><h4>$" + precio + "</h4></a></li>");
                    }

                    $("#listaMenu").listview('refresh');
                },
                error: function (e1, e2, e3)
                {
                    alert("error");
                }
            });
}

function verItemMenu(lnk)
{
    $.mobile.changePage('#verItemMenu');
    var id = lnk.attr("data-idItem");
    idPlatoPedido = id;
    $.ajax(
            {
                type: "GET",
                dataType: "JSON",
                url: "http://api.marcelocaiafa.com/menu/" + id,
                success: function (res)
                {
                    $("#listaItems").empty();
                    resultado = res;
                    var id = resultado.id;
                    var nombre = resultado.nombre;
                    var desc = resultado.descripcion;
                    var precio = resultado.precio;
                    $("#tituloPlato").html(nombre);
                    $("#listaItems").append("<li><a href='#' data-idItem='" + id + "'><img src='http://images.marcelocaiafa.com/menu/" + id + ".jpg'></a><h4>" + desc + "</h4><h4>$" + precio + "</h4></li>");
                    $("#listaItems").listview('refresh');
                    var db = window.openDatabase("ObliTecBD", "1.0", "Base de datos ObliTec", 1024 * 1024 * 2);
                    $("#btnToggle").attr('onClick', 'toggleFav(' + id + ')');
                    if (idUs != undefined)
                    {
                        db.transaction(exec_sql, error, success);
                        function exec_sql(tx)
                        {
                            tx.executeSql('SELECT * FROM FavoritosUsuario WHERE idUser = ? AND idPlato = ?', [idUs, id], function (tx, result)
                            {
                                if (result.rows.length != 0)
                                {
                                    $("#imgStar").attr('src', 'https://image.ibb.co/gQpaNF/img_Star_Fav.png');
                                } else
                                {
                                    
                                    $("#imgStar").attr('src', 'https://image.ibb.co/ngH6Uv/no_Fav_Star.png');
                                }
                            }
                            );
                        }
                    }
                    function error()
                    {
                        alert("Error al revisar si plato es favorito.");
                    }
                    function success()
                    {
                        $("#listaResultados").listview('refresh');
                    }

                },
                error: function (e1, e2, e3)
                {
                    alert("error");
                }
            });
}

function mostrarListaFavs()
{
    if (idUs != undefined)
    {
        $("#listaPlatosFav").empty();
        var db = window.openDatabase("ObliTecBD", "1.0", "Base de datos ObliTec", 1024 * 1024 * 2);
        db.transaction(exec_sql, error, success);
        function exec_sql(tx)
        {
            tx.executeSql('SELECT * FROM FavoritosUsuario WHERE idUser = ?', [idUs], function (tx, result)
            {
                if (result.rows.length != 0)
                {
                    for (i = 0; i < result.rows.length; i++)
                    {
                        var id = result.rows[i].idPlato;
                        $.ajax(
                                {
                                    type: "get",
                                    dataType: "JSON",
                                    url: "http://api.marcelocaiafa.com/menu/" + id,
                                    success: function (res)
                                    {
                                        resultado = res;
                                        var id = resultado.id;
                                        var nombre = resultado.nombre;
                                        var desc = resultado.descripcion;
                                        var precio = resultado.precio;
                                        $("#listaPlatosFav").append("<li><a href='#' data-idItem='" + id + "' onclick='verItemMenu($(this))'><img src='http://images.marcelocaiafa.com/menu/" + id + ".jpg'></a><h2>" + nombre + "</h2><h4>" + desc + "</h4><h4>$" + precio + "</h4></li>");
                                        $("#listaPlatosFav").listview('refresh');                                        
                                    }
                                });
                    }
                }
            })            
        }
        function success()
        {
        }
        function error()
        {
        }
    }
}

function toggleFav(idPlato)
{
    var db = window.openDatabase("ObliTecBD", "1.0", "Base de datos ObliTec", 1024 * 1024 * 2);
    db.transaction(exec_sql, error, success);
    function exec_sql(tx)
    {
        tx.executeSql('SELECT * FROM FavoritosUsuario WHERE idUser = (?) AND idPlato = (?)', [idUs, idPlato], function (tx, result)
        {
            if (result.rows.length != 0)
            {
                tx.executeSql('DELETE FROM FavoritosUsuario WHERE idUser = (?) AND idPlato = (?)', [idUs, idPlato]);
                $("#imgStar").attr('src', 'https://image.ibb.co/ngH6Uv/no_Fav_Star.png');
            } else
            {
                tx.executeSql('INSERT INTO FavoritosUsuario VALUES (?, ?)', [idUs, idPlato]);
                $("#imgStar").attr("src", 'https://image.ibb.co/gQpaNF/img_Star_Fav.png');
            }
        }
        );
    }
    function error()
    {
        alert("Error toggleando favoritos");
    }
    function success()
    {
    }
}

function pedido()
{
    var cant = nmbCantPedido.value;
    var precio;
    var uuidd;

    if(cant <= 0)
        {
            alert("Ingrese una cantidad para hacer un pedido.");
        }else if (idUs != undefined)
        {
        $.ajax(
                {
                    type: "GET",
                    dataType: "JSON",
                    url: "http://api.marcelocaiafa.com/user/" + idUs,
                    success: function (res)
                    {
                        uuidd = res.uuid;
                    },
                })

        $.ajax(
                {
                    type: "get",
                    dataType: "JSON",
                    url: "http://api.marcelocaiafa.com/menu/" + idPlatoPedido,
                    success: function (res)
                    {
                        precio = res.precio;
                        $.ajax(
                                {
                                    type: "post",
                                    datatype: "json",
                                    headers: {uuid: uuidd},
                                    url: "http://api.marcelocaiafa.com/delivery/",
                                    data: JSON.stringify(
                                            {
                                                menu: idPlatoPedido,
                                                cantidad: cant,
                                            }),
                                    success: function (resu)
                                    {
                                        alert("Pedido realizado! El costo total es $" + resu.cantidad * precio + " y la demora estimada es " + resu.tiempo + ".");
                                        goToIndex();
                                    },
                                    error: function ()
                                    {
                                        alert("Error al realizar pedido");
                                    }
                                });
                    }

                }
        );
    }
}